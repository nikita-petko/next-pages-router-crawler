import type {
  DagNode as AceDagNode,
  DagGraph as AceDagGraph,
  DagExecutionContext as AceDagExecutionContext,
} from '@rbx/client-analytics-query-gateway/v1';
import {
  NodeType as AceNodeType,
  ResourceType as AceResourceType,
  WindowReducer,
  type ConstantNodeConfig,
  type MathNodeConfig,
  type OutputConfig,
  type QueryFilter,
  type QueryBreakdown,
  type QueryNodeConfig,
  type RollingWindowConfig,
  type TopNConfig,
} from '@rbx/client-analytics-query-gateway/v1';
import {
  RAQIV2Dimension,
  RAQIV2MetricToSupportedDimensions,
  RAQIV2UIMetric,
  RAQIV2UIMetricToAPIConfig,
  RAQIV2UIPseudoDimension,
  type RAQIV2AggregationType,
  type RAQIV2PercentileType,
  type TRAQIV2Dimension,
  type TRAQIV2UIMetric,
  type TRAQIV2UIMetricFanoutDimensionValues,
} from '@rbx/creator-hub-analytics-config';
import type { AnalyticsQueryGatewayExecuteDagRequest } from '@modules/clients/analytics/analyticsQueryGateway';
import type { TQueryFilter as RAQIV2QueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import { mapChartResourceTypeToTargetResourceType } from '@modules/clients/analytics/analyticsRAQIShared';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { isDurationBucketDimension } from '../../constants/RAQIV2DurationBucketDimensions';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  isCustomEventsAtomicMetricLike,
  type ComputedMetric,
  type ComputedMetricSource,
} from '../../types/ComputedMetric';
import type { RAQIV2UIQueryRequest } from '../../types/RAQIV2UIQueryRequest';
import isMetricFanoutDimension, { hasMetricFanoutBreakdown } from '../isMetricFanoutDimension';
import { getTopNBreakdownConfig, isTopNBreakdownDimension } from '../isTopNBreakdownDimension';
import { RAQIV2ValidationError, RAQIV2ValidationErrorType } from '../validateRAQIV2Request';
import getReferencedComputedMetricSources from './getReferencedComputedMetricSources';
import {
  parseComputedMetricFormula,
  type BinaryOperator,
  type FormulaAstNode,
} from './parseComputedMetricFormula';
import {
  dimensionToRankBreakdownSpec,
  topNConfigToRankBreakdownSpec,
  type RankBreakdownSpec,
  type RankQueryNodeConfig,
} from './rankBreakdownSpec';
import {
  topNPseudoDimensionToAceConfig,
  type RankTopNConfig,
} from './topNPseudoDimensionToAceConfig';

// Computed metrics only support this subset of ACE DAG node operations.
type DagNodeType =
  | typeof AceNodeType.Query
  | typeof AceNodeType.Constant
  | typeof AceNodeType.Add
  | typeof AceNodeType.Subtract
  | typeof AceNodeType.Multiply
  | typeof AceNodeType.Divide
  | typeof AceNodeType.Power
  | typeof AceNodeType.Log
  | typeof AceNodeType.RollingWindow
  | typeof AceNodeType.Output;

type DagWindowReducer = typeof WindowReducer.Avg;

export type ComputedMetricDagRequest = AnalyticsQueryGatewayExecuteDagRequest;

// Stable node IDs the adapter uses to identify which output is the
// breakdown-bearing "main" series vs the companion "Total" series (segmentation
// stripped — duration bucket dimensions preserved when present). When the
// request has no breakdown, only `output_main` is emitted.
export const MAIN_OUTPUT_NODE_ID = 'output_main';
export const TOTAL_OUTPUT_NODE_ID = 'output_total';

// Suffix appended to every node ID in the companion total branch so it shares no
// IDs with the main branch (ACE requires globally unique node ids within a graph).
const TOTAL_BRANCH_SUFFIX = '_total';

type SupportedDagNode = Omit<AceDagNode, 'type'> & {
  type: DagNodeType;
  queryConfig?: QueryNodeConfig;
  constantConfig?: ConstantNodeConfig;
  mathConfig?: MathNodeConfig;
  rollingWindowConfig?: RollingWindowConfig & { reducer: DagWindowReducer };
  outputConfig?: OutputConfig;
};

const operatorToNodeType: Record<BinaryOperator, DagNodeType> = {
  '+': AceNodeType.Add,
  '-': AceNodeType.Subtract,
  '*': AceNodeType.Multiply,
  '/': AceNodeType.Divide,
  '^': AceNodeType.Power,
};

const isSourceOwnedGlobalFilterDimension = (dimension: TRAQIV2Dimension): boolean =>
  isMetricFanoutDimension(dimension) || dimension === RAQIV2Dimension.CustomEventName;

type AcePseudoDimensionValue = RAQIV2AggregationType | RAQIV2PercentileType;

type PreparedSourceMetric = {
  /**
   * Metric name emitted on `QueryNodeConfig.metric`. For fanout UI metrics
   * this is the pseudo name (`ServerMemoryUsageV2`, `CustomEventsV2`, …);
   * ACE resolves the variant server-side. For non-UI metrics this is the
   * API metric name passed through unchanged.
   */
  queryMetric: TRAQIV2UIMetric;
  /**
   * The caller's fanout selection, as a single variant — multi-value fanout is
   * not used on the computed-metric path, so this is a scalar rather than
   * ACE's `string[]` wire shape. `buildBranch` wraps it at the wire boundary.
   *
   * Undefined when the source has no selection (ACE uses the UI metric's
   * default variant) or when the metric is not a fanout UI metric.
   */
  acePseudoDimensionValue: AcePseudoDimensionValue | undefined;
  queryFilters: readonly RAQIV2QueryFilter[] | undefined;
  supportedDimensions: readonly TRAQIV2Dimension[];
};

type PreparedComputedMetricSource = ComputedMetricSource & PreparedSourceMetric;

type SupportedDimensionsMetric = Extract<
  keyof typeof RAQIV2MetricToSupportedDimensions,
  TRAQIV2UIMetric
>;

const hasSupportedDimensionsConfig = (
  metric: TRAQIV2UIMetric,
): metric is SupportedDimensionsMetric => Object.hasOwn(RAQIV2MetricToSupportedDimensions, metric);

const getSupportedDimensionsForMetric = (metric: TRAQIV2UIMetric): readonly TRAQIV2Dimension[] =>
  hasSupportedDimensionsConfig(metric) ? RAQIV2MetricToSupportedDimensions[metric] : [];

const isFanoutUIMetric = (metric: TRAQIV2UIMetric): metric is RAQIV2UIMetric =>
  Object.hasOwn(RAQIV2UIMetricToAPIConfig, metric);

/**
 * Picks the caller's selection for the metric's configured fanout dimension.
 *
 * Only that one dimension's value is used. Sending both AggregationType and
 * PercentileType would make ACE treat the node as a multi-value fanout
 * (`Count > 1`) rather than a single-variant resolve. Empty / null selection →
 * `undefined` so ACE uses the default variant.
 *
 * ACE's `MetricVariantKeys.ToStableKey` normalizes FE enum strings
 * (`"P90"`, `"Sum"`, `"AVG"`, `"Average"`, …) to stable keys, so we emit
 * the FE enum values directly.
 *
 * Exhaustive over the fanout dimensions so that a new one added upstream in
 * `RAQIV2UIMetricToAPIConfig` fails the build here rather than silently
 * dropping the selection and letting ACE fall back to the default variant.
 */
const toAcePseudoDimensionValue = (
  uiMetric: RAQIV2UIMetric,
  values: TRAQIV2UIMetricFanoutDimensionValues | undefined,
): AcePseudoDimensionValue | undefined => {
  if (!values) {
    return undefined;
  }

  const { dimension } = RAQIV2UIMetricToAPIConfig[uiMetric];
  switch (dimension) {
    case RAQIV2UIPseudoDimension.PercentileType:
      return values.percentile ?? undefined;
    case RAQIV2UIPseudoDimension.AggregationType:
      return values.aggregationType ?? undefined;
    default: {
      const exhaustiveCheck: never = dimension;
      throw new Error(`Unhandled fanout dimension: ${String(exhaustiveCheck)}`);
    }
  }
};

/**
 * Prepares a computed-metric source for ACE DAG emission. For UI metrics
 * (`ServerMemoryUsageV2`, `CustomEventsV2`, …), the typed
 * `pseudoDimensionValues` carries the caller's fanout selection
 * (AggregationType / PercentileType), and `customEventName` carries the
 * CustomEventsV2 source identity. Both are authoritative.
 *
 * Emits the UI metric name + ACE `pseudoDimensionValues` so ACE resolves
 * the variant server-side via the shared MetricResolution library
 * (DSA-5716 / pseudo-metrics RFC §4.6.1 step 3.b). Does not call
 * `getAPIMetricFromUIMetric`.
 *
 * `filters` must already be real query filters only. Fanout pseudo-dimension
 * filters and CustomEventName source identity are stripped at producer
 * boundaries (L7 smoothing helper, equation builder, URL deserializer).
 */
const prepareSourceMetric = (source: ComputedMetricSource): PreparedSourceMetric => {
  const { metric, filters: sourceFilters, pseudoDimensionValues } = source;
  const uiMetric = getUIMetricFromAtomicMetricLike(metric);
  const customEventsMetric = isCustomEventsAtomicMetricLike(metric) ? metric : null;
  const legacyCustomEventName =
    'customEventName' in source && typeof source.customEventName === 'string'
      ? source.customEventName
      : undefined;
  const customEventName = customEventsMetric?.customEventName ?? legacyCustomEventName;
  const sourcePseudoDimensionValues =
    customEventsMetric?.aggregationType !== undefined
      ? {
          aggregationType: customEventsMetric.aggregationType,
          percentile: pseudoDimensionValues?.percentile ?? null,
        }
      : pseudoDimensionValues;

  // Developer-only invariant check: the source identity carrier on the
  // atomic (`CustomEventsAtomicMetricLike.customEventName`) only makes
  // sense for CustomEventsV2 sources. The other two historical invariants
  // here — "no fanout pseudo-dimensions in filters", "no CustomEventName
  // in filters" — are now enforced structurally by
  // `ComputedMetricSourceFilter`, so no runtime guard is needed.
  if (process.env.NODE_ENV !== 'production') {
    if (customEventName && uiMetric !== RAQIV2UIMetric.CustomEventsV2) {
      throw new Error(
        `CustomEventsV2 atomic source identity is only valid for CustomEventsV2 sources; ` +
          `got "${uiMetric}" on source "${source.key}".`,
      );
    }
  }

  const resolvedSourceFilters =
    customEventName && uiMetric === RAQIV2UIMetric.CustomEventsV2
      ? [
          { dimension: RAQIV2Dimension.CustomEventName, values: [customEventName] },
          ...(sourceFilters ?? []),
        ]
      : sourceFilters;

  const queryFilters =
    resolvedSourceFilters && resolvedSourceFilters.length > 0 ? resolvedSourceFilters : undefined;
  const supportedDimensions = getSupportedDimensionsForMetric(uiMetric);

  if (!isFanoutUIMetric(uiMetric)) {
    // Non-fanout metrics (plain API metrics, or unexpected enum members) pass
    // through with no pseudoDimensionValues — ACE treats them as ordinary
    // metric names.
    return {
      queryMetric: uiMetric,
      acePseudoDimensionValue: undefined,
      queryFilters,
      supportedDimensions,
    };
  }

  return {
    queryMetric: uiMetric,
    acePseudoDimensionValue: toAcePseudoDimensionValue(uiMetric, sourcePseudoDimensionValues),
    queryFilters,
    supportedDimensions,
  };
};

const getSharedSupportedDimensions = (
  sources: readonly PreparedComputedMetricSource[],
): Set<TRAQIV2Dimension> => {
  const [firstSource, ...otherSources] = sources;
  if (!firstSource) {
    return new Set();
  }

  return new Set(
    firstSource.supportedDimensions.filter((dimension) =>
      otherSources.every((source) => source.supportedDimensions.includes(dimension)),
    ),
  );
};

const validateSourceLevelFilters = (source: PreparedComputedMetricSource) => {
  source.queryFilters?.forEach((filter) => {
    if (!source.supportedDimensions.includes(filter.dimension)) {
      throw new RAQIV2ValidationError(
        RAQIV2ValidationErrorType.UnsupportedFilter,
        `Metric ${source.queryMetric} does not support source-level filter dimension ${filter.dimension}.`,
        getUIMetricFromAtomicMetricLike(source.metric),
        filter.dimension,
      );
    }
  });
};

const toQueryBreakdowns = (
  breakdown: RAQIV2UIQueryRequest['breakdown'],
): QueryBreakdown[] | undefined => {
  if (!breakdown || breakdown.length === 0) {
    return undefined;
  }
  return breakdown.map((dimension) => ({ dimensions: [dimension] }));
};

const splitTopNBreakdownDimensions = (
  breakdown: readonly TRAQIV2Dimension[] | undefined,
): {
  topNBreakdowns: TRAQIV2Dimension[];
  passthroughBreakdowns: TRAQIV2Dimension[];
} => {
  const topNBreakdowns: TRAQIV2Dimension[] = [];
  const passthroughBreakdowns: TRAQIV2Dimension[] = [];

  breakdown?.forEach((dimension) => {
    if (isTopNBreakdownDimension(dimension)) {
      topNBreakdowns.push(dimension);
      return;
    }
    passthroughBreakdowns.push(dimension);
  });

  return { topNBreakdowns, passthroughBreakdowns };
};

const getSupportedTopNBreakdownConfigs = (
  topNBreakdowns: readonly TRAQIV2Dimension[],
  sharedSupportedDimensions: ReadonlySet<TRAQIV2Dimension>,
): RankTopNConfig[] =>
  topNBreakdowns.flatMap((dimension) => {
    const config = getTopNBreakdownConfig(dimension);
    if (
      !config ||
      !isValidEnumValue(RAQIV2Dimension, config.filterAndBreakdownDimension) ||
      !sharedSupportedDimensions.has(config.filterAndBreakdownDimension)
    ) {
      return [];
    }
    return [topNPseudoDimensionToAceConfig(config)];
  });

const getUniqueBreakdowns = (breakdowns: readonly TRAQIV2Dimension[]): TRAQIV2Dimension[] => {
  const seen = new Set<TRAQIV2Dimension>();
  return breakdowns.filter((dimension) => {
    if (seen.has(dimension)) {
      return false;
    }
    seen.add(dimension);
    return true;
  });
};

const buildExpressionNodes = (
  ast: FormulaAstNode,
  nodeByVariable: Map<string, string>,
  nodes: SupportedDagNode[],
  idFactories: { nextMathId: () => string; nextConstantId: () => string },
): string => {
  switch (ast.type) {
    case 'identifier': {
      const inputNodeId = nodeByVariable.get(ast.name);
      if (!inputNodeId) {
        throw new Error(`Unknown variable "${ast.name}"`);
      }
      return inputNodeId;
    }
    case 'number': {
      const nodeId = idFactories.nextConstantId();
      nodes.push({
        id: nodeId,
        type: AceNodeType.Constant,
        constantConfig: {
          value: ast.value,
        },
      });
      return nodeId;
    }
    case 'binary': {
      const leftNodeId = buildExpressionNodes(ast.left, nodeByVariable, nodes, idFactories);
      const rightNodeId = buildExpressionNodes(ast.right, nodeByVariable, nodes, idFactories);
      const nodeId = idFactories.nextMathId();
      nodes.push({
        id: nodeId,
        type: operatorToNodeType[ast.operator],
        mathConfig: {
          inputs: [leftNodeId, rightNodeId],
        },
      });
      return nodeId;
    }
    case 'function': {
      switch (ast.name) {
        case 'log': {
          const valueNodeId = buildExpressionNodes(ast.args[0], nodeByVariable, nodes, idFactories);
          const baseNodeId = ast.args[1]
            ? buildExpressionNodes(ast.args[1], nodeByVariable, nodes, idFactories)
            : (() => {
                const nodeId = idFactories.nextConstantId();
                nodes.push({
                  id: nodeId,
                  type: AceNodeType.Constant,
                  constantConfig: {
                    value: Math.E,
                  },
                });
                return nodeId;
              })();
          const nodeId = idFactories.nextMathId();
          nodes.push({
            id: nodeId,
            type: AceNodeType.Log,
            mathConfig: {
              inputs: [valueNodeId, baseNodeId],
            },
          });
          return nodeId;
        }
        default: {
          const exhaustiveCheck: never = ast;
          throw new Error(`Unsupported function: ${String(exhaustiveCheck)}`);
        }
      }
    }
    default: {
      const exhaustiveCheck: never = ast;
      throw new Error(`Unsupported AST node: ${String(exhaustiveCheck)}`);
    }
  }
};

const mergeSourceAndDagLevelFilters = (
  sourceFilters: readonly RAQIV2QueryFilter[] | undefined,
  globalFilters: readonly RAQIV2QueryFilter[] | undefined,
): QueryNodeConfig['filters'] => {
  // Source-level filters are additive with page-wide filters.
  // If a source captures current page filters, de-duplicate identical filters
  // so ACE receives a stable, non-redundant merged filter set.
  const mergedFilters = [...(globalFilters ?? []), ...(sourceFilters ?? [])];
  if (mergedFilters.length === 0) {
    return undefined;
  }

  const deduped: QueryFilter[] = [];
  const seen = new Set<string>();
  mergedFilters.forEach((filter) => {
    const signature = JSON.stringify(filter);
    if (!seen.has(signature)) {
      seen.add(signature);
      deduped.push({
        ...filter,
        values: [...filter.values],
      } as QueryFilter);
    }
  });
  return deduped;
};

type BranchBuildArgs = {
  computedMetric: ComputedMetric;
  preparedSources: readonly PreparedComputedMetricSource[];
  ast: FormulaAstNode;
  globalFilters: readonly RAQIV2QueryFilter[] | undefined;
  branchBreakdown: QueryBreakdown[] | undefined;
  topNConfig: TopNConfig | undefined;
  rankBreakdownSpecs: RankBreakdownSpec[] | undefined;
  outputNodeId: string;
  outputAlias: string;
  // Suffix to append to every generated node id so two branches can coexist in
  // the same DAG without colliding (ACE requires unique node ids per graph).
  nodeIdSuffix: string;
  nodes: SupportedDagNode[];
};

/**
 * Builds one full computed-metric DAG branch (per-source Query nodes →
 * arithmetic nodes → optional rolling window → Output) and pushes the nodes
 * onto the shared `nodes` array. Returns the id of the output node.
 *
 * Called once for the breakdown-bearing "main" branch and, when needed, again
 * for the "Total" companion branch. The companion strips segmentation
 * dimensions but preserves duration bucket dimensions (`SessionTimeBucket`, …)
 * so duration adapters stay valid — mirroring `buildTotalRequestIfNecessary`.
 */
const buildBranch = (args: BranchBuildArgs): void => {
  const {
    computedMetric,
    preparedSources,
    ast,
    globalFilters,
    branchBreakdown,
    topNConfig,
    rankBreakdownSpecs,
    outputNodeId,
    outputAlias,
    nodeIdSuffix,
    nodes,
  } = args;

  const nodeByVariable = new Map<string, string>();
  const seenVariableKeys = new Set<string>();
  preparedSources.forEach((source) => {
    if (seenVariableKeys.has(source.key)) {
      throw new Error(`Duplicate variable key "${source.key}" in computed metric`);
    }
    seenVariableKeys.add(source.key);

    const { queryMetric, acePseudoDimensionValue, queryFilters } = source;
    validateSourceLevelFilters(source);

    const queryNodeId = `query_${source.key}${nodeIdSuffix}`;
    nodeByVariable.set(source.key, queryNodeId);
    const queryConfig: RankQueryNodeConfig = {
      metric: queryMetric,
      breakdown: branchBreakdown,
      filters: mergeSourceAndDagLevelFilters(queryFilters, globalFilters),
      topN: rankBreakdownSpecs ? undefined : topNConfig,
      breakdownSpecs: rankBreakdownSpecs,
      pseudoDimensionValues: acePseudoDimensionValue ? [acePseudoDimensionValue] : undefined,
    };

    nodes.push({
      id: queryNodeId,
      type: AceNodeType.Query,
      queryConfig,
    });
  });

  let mathCounter = 0;
  let constantCounter = 0;
  const rawResultNodeId = buildExpressionNodes(ast, nodeByVariable, nodes, {
    nextMathId: () => {
      mathCounter += 1;
      return `math_${mathCounter}${nodeIdSuffix}`;
    },
    nextConstantId: () => {
      constantCounter += 1;
      return `const_${constantCounter}${nodeIdSuffix}`;
    },
  });

  let outputInputNodeId = rawResultNodeId;
  if (computedMetric.l7Smoothing) {
    const smoothingNodeId = `rolling_l7_avg${nodeIdSuffix}`;
    nodes.push({
      id: smoothingNodeId,
      type: AceNodeType.RollingWindow,
      rollingWindowConfig: {
        input: rawResultNodeId,
        windowSize: 7,
        reducer: WindowReducer.Avg,
      },
    });
    outputInputNodeId = smoothingNodeId;
  }

  nodes.push({
    id: outputNodeId,
    type: AceNodeType.Output,
    outputConfig: {
      input: outputInputNodeId,
      alias: outputAlias,
    },
  });
};

export type BuildComputedMetricDagOptions = {
  /**
   * Caller opt-in for the parallel no-breakdown "Total" branch. Mirrors the
   * standard (non-computed) RAQI flow's `MakeRAQIV2RequestOptions.fetchTotalSeries`:
   * surfaces are split between those that want a Total row/series alongside
   * their breakdowns (summary cards, top-breakdown charts, tables that set
   * `isTotalRowIncluded: true`) and those that explicitly do not (Explore
   * Mode table, item summary cards, player-feedback chart, …).
   *
   * When false/omitted, the duplicate branch is skipped even if the request
   * has a real breakdown — silently emitting a Total branch for opt-out
   * surfaces would round-trip into `combineRAQIV2QueryResponses` and prepend
   * a `Label.Total` row/series the caller never asked for.
   *
   * Additionally, the duplicate branch is never emitted when the UI breakdown
   * includes a metric-fanout pseudo-dimension (`AggregationType`,
   * `PercentileType`), matching {@link hasMetricFanoutBreakdown} / chart
   * surfaces that pass `fetchTotalSeries: false` in that case: the no-breakdown
   * series would repeat one fanout line rather than a meaningful aggregate.
   *
   * When the only real breakdown dimensions are duration buckets, no duplicate
   * is emitted — same gate as `buildTotalRequestIfNecessary` (nothing to strip
   * except buckets the duration chart must keep).
   */
  includeTotalBranch?: boolean;
  emitRankBreakdownSpec?: boolean;
};

export const buildComputedMetricDag = (
  request: RAQIV2UIQueryRequest,
  options: BuildComputedMetricDagOptions = {},
): ComputedMetricDagRequest => {
  const { metric: computedMetric } = request;
  if (!isComputedMetric(computedMetric)) {
    throw new Error('Expected computed metric request for ACE DAG construction');
  }
  const sourceKeys = computedMetric.sources.map((source) => source.key);
  const parseResult = parseComputedMetricFormula(computedMetric.formula, sourceKeys);
  if (!parseResult.ok) {
    throw new Error(parseResult.errors.join('; '));
  }

  const referencedSources = getReferencedComputedMetricSources(computedMetric);
  const referencedSourceKeys = referencedSources.map((source) => source.key);

  const preparedSources = referencedSources.map((source) => ({
    ...source,
    ...prepareSourceMetric(source),
  }));
  const sharedSupportedDimensions = getSharedSupportedDimensions(preparedSources);

  // Page-level filters may contain source-owned values persisted in URL params
  // from non-computed mode (AggregationType / PercentileType / CustomEventName).
  // Those are not valid ACE QueryFilters — fanout selections live on each
  // query node's `pseudoDimensionValues`, and CustomEventName is synthesized
  // per-source from the atomic identity. Strip them from the global filter
  // set so they never leak onto ACE query nodes.
  const { topNBreakdowns, passthroughBreakdowns } = splitTopNBreakdownDimensions(request.breakdown);
  const topNConfigs = getSupportedTopNBreakdownConfigs(topNBreakdowns, sharedSupportedDimensions);
  if (!options.emitRankBreakdownSpec && topNConfigs.length > 1) {
    throw new RAQIV2ValidationError(
      RAQIV2ValidationErrorType.UnsupportedBreakdown,
      'Computed metrics support at most one TopN breakdown dimension.',
      getUIMetricFromAtomicMetricLike(computedMetric.sources[0].metric),
    );
  }

  const realBreakdowns = getUniqueBreakdowns([
    ...passthroughBreakdowns.filter(
      (d) =>
        !isMetricFanoutDimension(d) &&
        (sharedSupportedDimensions.has(d) || isDurationBucketDimension(d)),
    ),
    ...topNConfigs.map((config) => config.dimension),
  ]);
  const rankedDimensions = new Set<TRAQIV2Dimension>(topNConfigs.map((config) => config.dimension));
  const rankBreakdownSpecs = options.emitRankBreakdownSpec
    ? [
        // Pseudo-dimensions cannot carry a wire breakdown spec, so they are
        // dropped here rather than widening `RankBreakdownSpec.dimension`.
        ...realBreakdowns.flatMap((dimension) =>
          !rankedDimensions.has(dimension) && isValidEnumValue(RAQIV2Dimension, dimension)
            ? [dimensionToRankBreakdownSpec(dimension)]
            : [],
        ),
        ...topNConfigs.map(topNConfigToRankBreakdownSpec),
      ]
    : undefined;
  const topNConfig = options.emitRankBreakdownSpec ? undefined : topNConfigs[0];
  const queryBreakdowns = toQueryBreakdowns(realBreakdowns);

  const durationBucketBreakdowns = realBreakdowns.filter(isDurationBucketDimension);
  const nonDurationBreakdowns = realBreakdowns.filter((d) => !isDurationBucketDimension(d));
  const totalBranchBreakdown =
    durationBucketBreakdowns.length > 0 ? toQueryBreakdowns(durationBucketBreakdowns) : undefined;

  const globalFilters = request.filter?.filter(
    (f) =>
      !isSourceOwnedGlobalFilterDimension(f.dimension) &&
      sharedSupportedDimensions.has(f.dimension),
  );

  const outputAliasBase = `computed_${referencedSourceKeys.join('_')}`;
  const nodes: SupportedDagNode[] = [];

  buildBranch({
    computedMetric,
    preparedSources,
    ast: parseResult.ast,
    globalFilters,
    branchBreakdown: queryBreakdowns,
    topNConfig,
    rankBreakdownSpecs,
    outputNodeId: MAIN_OUTPUT_NODE_ID,
    outputAlias: outputAliasBase,
    nodeIdSuffix: '',
    nodes,
  });

  // Emit the parallel "Total" companion branch when appropriate — mirrors
  // `buildTotalRequestIfNecessary`: strip non-duration segmentation only, but
  // keep duration bucket dimensions so duration adapters still receive bucketed
  // rows. Gates:
  //   - Caller opt-in (`includeTotalBranch`).
  //   - Real ACE breakdown present (`queryBreakdowns`).
  //   - Non-duration segmentation exists to strip (`nonDurationBreakdowns`), or
  //     we would only duplicate the duration axes (standard flow skips total).
  //   - No metric-fanout pseudo-dimension in the UI breakdown (see above).
  const shouldEmitTotalBranch =
    options.includeTotalBranch &&
    queryBreakdowns !== undefined &&
    nonDurationBreakdowns.length > 0 &&
    !hasMetricFanoutBreakdown(request.breakdown);

  if (shouldEmitTotalBranch) {
    buildBranch({
      computedMetric,
      preparedSources,
      ast: parseResult.ast,
      globalFilters,
      branchBreakdown: totalBranchBreakdown,
      topNConfig: undefined,
      rankBreakdownSpecs: undefined,
      outputNodeId: TOTAL_OUTPUT_NODE_ID,
      outputAlias: `${outputAliasBase}_total`,
      nodeIdSuffix: TOTAL_BRANCH_SUFFIX,
      nodes,
    });
  }

  const graph: AceDagGraph = {
    id: `computed_metric_${outputAliasBase}`,
    name: 'Computed Metric DAG',
    nodes,
  };
  const context: AceDagExecutionContext = {
    resourceType: mapChartResourceTypeToTargetResourceType(request.resource.type, AceResourceType),
    resourceId: request.resource.id.toString(),
    granularity: request.granularity,
    startTime: request.timeSpec.startTime.toISOString(),
    endTime: request.timeSpec.endTime.toISOString(),
  };

  return {
    graph,
    context,
  };
};
