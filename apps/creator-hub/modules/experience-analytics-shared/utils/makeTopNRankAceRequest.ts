/**
 * ACE path for standard (non-computed) TopN / rank breakdowns such as
 * TopCountries and TopLocales.
 *
 * ## When this module runs
 * `makeTopNRankAceRequest` is the entry point. It returns a populated
 * `RAQIV2QueryResponses` when the request is eligible for ACE rank emission,
 * otherwise `null` so `makeRAQIV2Request` can fall back to the legacy FE
 * TopN pre-query / stitch path.
 *
 * Eligibility (all must hold):
 * - at least one TopN pseudo-dimension breakdown is present
 * - no competing concerns: everything listed in `LegacyTopNOnlyFeatures`, or a
 *   comparison whose rank window cannot be pinned to the primary period
 *
 * ## DAG shapes
 * Built by `buildStandardRankDagRequest`:
 *
 * Non-comparison:
 *   query_main (rank BreakdownSpec on TopN dims) -> output_main
 *   optional: query_total -> output_total
 *
 * Comparison (rank edges via `dynamicFilterBindings`, not graph edges):
 *                            +-- CONTAINS -----> query_main  -> output_main
 *   query_rank_selection ----+
 *                            +-- NOT_CONTAINS -> query_other -> output_other
 *   optional: query_total -> output_total
 *
 * Rank selection uses the primary query window (pinned via
 * `orderTimeRangeDays` when the TopN config would otherwise rank over the
 * combined comparison span). Main + Other then run over the combined
 * [comparisonStart, primaryEnd] range; the executor slices that single
 * response into primary vs comparison series.
 *
 * ## Other vs total
 * - `query_other` / `output_other`: remainder aggregate outside the ranked
 *   set (NotContains on rank-selection values). Labeled with the TopN Other
 *   sentinel in the response adapter.
 * - `query_total` / `output_total`: independent unranked total branch. Do not
 *   confuse with Other.
 *
 * @see topNPseudoDimensionToAceConfig for display-config -> TopNConfig mapping
 * @see processUngroupedOtherResponse for Other sentinel labeling
 */
import {
  NodeType as AceNodeType,
  ResourceType as AceResourceType,
  type DagExecutionContext as AceDagExecutionContext,
  type DagGraph as AceDagGraph,
  type DagNode as AceDagNode,
  type DynamicFilterBinding,
  type QueryBreakdown,
  type QueryFilter,
} from '@rbx/client-analytics-query-gateway/v1';
import type {
  RAQIV2Dimension,
  TRAQIV2APIMetric,
  TUIPseudoDimensionTopNBreakdownConfig,
} from '@rbx/creator-hub-analytics-config';
import type { AnalyticsQueryGatewayExecuteDagRequest } from '@modules/clients/analytics/analyticsQueryGateway';
import { AnalyticsQueryGatewayAPIFilterOperation as RAQIV2FilterOperation } from '@modules/clients/analytics/analyticsQueryGateway';
import type {
  FilterOperation as TRAQIV2FilterOperation,
  QueryFilter as RAQIV2APIQueryFilter,
} from '@modules/clients/analytics/analyticsRAQIShared';
import { mapChartResourceTypeToTargetResourceType } from '@modules/clients/analytics/analyticsRAQIShared';
import { isDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';
import { DAY_MS } from '../constants/timeConstants';
import type { RAQIV2CombinedUIQueryRequestWithoutMetric } from '../types/RAQIV2UIQueryRequest';
import type { RAQIV2QueryResponses } from './combineRAQIV2QueryResponses';
import {
  MAIN_OUTPUT_NODE_ID,
  TOTAL_OUTPUT_NODE_ID,
} from './computedMetrics/buildComputedMetricDag';
import {
  dimensionToRankBreakdownSpec,
  topNConfigToRankBreakdownSpec,
  type RankBreakdownSpec,
  type RankQueryNodeConfig,
} from './computedMetrics/rankBreakdownSpec';
import {
  isPinnedRankTopNConfig,
  topNPseudoDimensionToAceConfig,
  type PinnedRankTopNConfig,
  type RankTopNConfig,
} from './computedMetrics/topNPseudoDimensionToAceConfig';
import getComparisonRange, { type ComparisonRangeSpec } from './getComparisonRange';
import makeACERequest, { type ACERequestClients, type DagResultAdapter } from './makeACERequest';
import sliceRAQIV2QueryResultByTimeRange from './sliceRAQIV2QueryResultByTimeRange';
import { processUngroupedOtherResponse } from './topNResponseUtils';

/**
 * Query node ids in the rank DAG. Output nodes reference a query node by id, so
 * naming them makes a mis-wired edge a compile error instead of an orphan node.
 */
const RankQueryNodeId = {
  RankSelection: 'query_rank_selection',
  Main: 'query_main',
  Other: 'query_other',
  Total: 'query_total',
} as const;
type TRankQueryNodeId = (typeof RankQueryNodeId)[keyof typeof RankQueryNodeId];

const OTHER_OUTPUT_NODE_ID = 'output_other';

/**
 * Request features only the legacy FE TopN flow implements. Grouped into one
 * parameter so a new exclusion is a single added key — the eligibility check
 * reads every value, so it is impossible to declare a concern and forget to
 * honor it.
 */
type LegacyTopNOnlyFeatures = {
  fillsMissingDatapoints: boolean | undefined;
  hasMetricFanoutBreakdown: boolean;
  hasMetricFanoutFilters: boolean;
  hasOtherSeriesFilters: boolean;
  hasOtherSeriesNotContainsFilters: boolean;
};

/**
 * The parts of a query request the rank DAG actually reads. Narrower than
 * `RAQIV2CombinedUIQueryRequest` on purpose: metric and breakdown are passed
 * explicitly, so accepting the full request would give the builder two
 * divergable sources of truth for both.
 */
type RankDagRequestSpec = Pick<
  RAQIV2CombinedUIQueryRequestWithoutMetric,
  'resource' | 'granularity' | 'timeSpec' | 'filter'
>;

type MakeTopNRankAceRequestParams = {
  clients: ACERequestClients;
  request: RankDagRequestSpec;
  metric: TRAQIV2APIMetric;
  /** Non-TopN breakdown dimensions already resolved to API dimensions. */
  apiBreakdown: readonly RAQIV2Dimension[];
  /** TopN pseudo-dimension configs (e.g. TopCountries) from the UI breakdown. */
  topNBreakdownConfigs: readonly TUIPseudoDimensionTopNBreakdownConfig[];
  fetchTotalSeries?: boolean;
  comparison?: ComparisonRangeSpec;
  legacyOnlyFeatures: LegacyTopNOnlyFeatures;
};

const toAceQueryBreakdowns = (
  breakdown: readonly RAQIV2Dimension[],
): QueryBreakdown[] | undefined =>
  breakdown.length > 0 ? breakdown.map((dimension) => ({ dimensions: [dimension] })) : undefined;

// Maps field by field rather than spreading: the RAQI filter and the gateway's
// generated filter are independently generated types, and a spread would
// silently forward any field one gains that the other does not model.
const toAceQueryFilters = (
  filters: readonly RAQIV2APIQueryFilter[] | undefined,
): QueryFilter[] | undefined =>
  filters?.map(({ dimension, values, operation }) => ({
    dimension,
    values: [...values],
    operation,
  }));

/** Passthrough (unranked) dims + TopN dims carrying `dimensionBreakdown.rank`. */
const buildRankBreakdownSpecs = (
  apiBreakdown: readonly RAQIV2Dimension[],
  topNConfigs: readonly RankTopNConfig[],
): RankBreakdownSpec[] => {
  const rankedDimensions = new Set(topNConfigs.map((config) => config.dimension));
  return [
    ...apiBreakdown
      .filter((dimension) => !rankedDimensions.has(dimension))
      .map(dimensionToRankBreakdownSpec),
    ...topNConfigs.map(topNConfigToRankBreakdownSpec),
  ];
};

/**
 * Rank-selection node specs for comparison. Force `excludeOtherSeries` so the
 * selection output is only the Top N values; Other is produced separately via
 * the NotContains `query_other` branch.
 */
const buildRankSelectionBreakdownSpecs = (
  apiBreakdown: readonly RAQIV2Dimension[],
  topNConfigs: readonly RankTopNConfig[],
): RankBreakdownSpec[] =>
  buildRankBreakdownSpecs(apiBreakdown, topNConfigs).map((spec) =>
    spec.dimensionBreakdown.rank
      ? { ...spec, dimensionBreakdown: { ...spec.dimensionBreakdown, excludeOtherSeries: true } }
      : spec,
  );

const buildDynamicRankFilterBindings = (
  topNConfigs: readonly RankTopNConfig[],
  operation: TRAQIV2FilterOperation,
): DynamicFilterBinding[] =>
  topNConfigs.map((config) => ({
    input: RankQueryNodeId.RankSelection,
    dimension: config.dimension,
    operation,
  }));

/**
 * Other-branch bindings: NotContains when Other is included, Contains when
 * excluded (in which case no Other branch is built at all, see
 * `getOtherRemainderDimensions`).
 */
const buildDynamicOtherRankFilterBindings = (
  topNConfigs: readonly RankTopNConfig[],
): DynamicFilterBinding[] =>
  topNConfigs.map((config) => ({
    input: RankQueryNodeId.RankSelection,
    dimension: config.dimension,
    operation: config.excludeOtherSeries
      ? RAQIV2FilterOperation.Contains
      : RAQIV2FilterOperation.NotContains,
  }));

/** Ranked dimensions that need a synthetic Other bucket in the response. */
const getOtherRemainderDimensions = (topNConfigs: readonly RankTopNConfig[]): RAQIV2Dimension[] =>
  topNConfigs.filter((config) => !config.excludeOtherSeries).map((config) => config.dimension);

const getPrimaryWindowOrderTimeRangeDays = (timeSpec: RankDagRequestSpec['timeSpec']): number => {
  const durationDays = Math.ceil(
    (timeSpec.endTime.getTime() - timeSpec.startTime.getTime()) / DAY_MS,
  );
  return Math.max(1, durationDays);
};

/**
 * Maps a TopN display config to ACE `TopNConfig`. For comparison requests whose
 * config would rank over the full query range, pin `orderTimeRangeDays` to the
 * primary window length so rank selection stays on the primary period even
 * though the DAG runs over the combined span.
 */
const topNPseudoDimensionToAceConfigForRequest = (
  config: TUIPseudoDimensionTopNBreakdownConfig,
  timeSpec: RankDagRequestSpec['timeSpec'],
  comparison: ComparisonRangeSpec | undefined,
): RankTopNConfig => {
  const aceConfig = topNPseudoDimensionToAceConfig(config);
  if (comparison === undefined || isPinnedRankTopNConfig(aceConfig)) {
    return aceConfig;
  }

  return {
    ...aceConfig,
    orderTimeRangeDays: getPrimaryWindowOrderTimeRangeDays(timeSpec),
  };
};

/**
 * Maps ACE DAG outputs back to the RAQI-shaped response the chart stack expects:
 * main series, optional Other (sentinel-labeled), optional total.
 */
const adaptStandardRankDagResponseToRAQIV2Result =
  (otherDimensions: readonly RAQIV2Dimension[]): DagResultAdapter<RAQIV2QueryResponses> =>
  (response) => {
    const outputs = response.result?.outputs;
    if (!outputs || outputs.length === 0) {
      return null;
    }

    const mainValues = outputs.find((output) => output.nodeId === MAIN_OUTPUT_NODE_ID)?.timeSeries
      ?.values;
    if (!mainValues) {
      return null;
    }

    const result: RAQIV2QueryResponses = {
      response: { values: mainValues },
    };

    const otherValues = outputs.find((output) => output.nodeId === OTHER_OUTPUT_NODE_ID)?.timeSeries
      ?.values;
    if (otherValues) {
      const otherResponse = processUngroupedOtherResponse({ values: otherValues }, otherDimensions);
      if (otherResponse) {
        result.response = {
          values: [...mainValues, ...(otherResponse.values ?? [])],
        };
      }
    }

    const totalValues = outputs.find((output) => output.nodeId === TOTAL_OUTPUT_NODE_ID)?.timeSeries
      ?.values;
    if (totalValues) {
      result.totalSeriesResponse = { values: totalValues };
    }

    return result;
  };

const buildOutputNode = (outputNodeId: string, input: TRankQueryNodeId): AceDagNode => ({
  id: outputNodeId,
  type: AceNodeType.Output,
  outputConfig: {
    input,
    alias: outputNodeId,
  },
});

/**
 * Builds the standard TopN rank DAG.
 *
 * Non-comparison:
 *   query_main (rank BreakdownSpec) -> output_main
 *
 * Comparison (rank edges are `dynamicFilterBindings`, not graph edges):
 *                            +-- CONTAINS -----> query_main  -> output_main
 *   query_rank_selection ----+
 *                            +-- NOT_CONTAINS -> query_other -> output_other
 *
 *   query_total -> output_total  (optional and independent)
 *
 * `query_other` omits the ranked dimensions from its breakdown, so it returns
 * the filtered aggregate outside the primary-window Top N. The response adapter
 * labels that aggregate as the TopN "Other" sentinel and appends it to the main
 * values. `query_total` is a separate unranked total branch and must not be
 * confused with `query_other`.
 */
const buildStandardRankDagRequest = ({
  request,
  metric,
  apiBreakdown,
  topNConfigs,
  fetchTotalSeries,
  useDynamicFilterBindings = false,
}: {
  request: RankDagRequestSpec;
  metric: TRAQIV2APIMetric;
  apiBreakdown: readonly RAQIV2Dimension[];
  topNConfigs: readonly RankTopNConfig[];
  fetchTotalSeries?: boolean;
  useDynamicFilterBindings?: boolean;
}): AnalyticsQueryGatewayExecuteDagRequest => {
  const filters = toAceQueryFilters(request.filter);
  const rankBreakdownSpecs = useDynamicFilterBindings
    ? buildRankSelectionBreakdownSpecs(apiBreakdown, topNConfigs)
    : buildRankBreakdownSpecs(apiBreakdown, topNConfigs);

  const rankQueryConfig: RankQueryNodeConfig = {
    metric,
    filters,
    breakdownSpecs: rankBreakdownSpecs,
  };
  const mainQueryConfig: RankQueryNodeConfig = useDynamicFilterBindings
    ? {
        metric,
        breakdown: toAceQueryBreakdowns(apiBreakdown),
        filters,
        dynamicFilterBindings: buildDynamicRankFilterBindings(
          topNConfigs,
          RAQIV2FilterOperation.Contains,
        ),
      }
    : rankQueryConfig;

  // Base path: query_main -> output_main. In the comparison DAG,
  // query_rank_selection is prepended and query_main consumes its dimension
  // values through the CONTAINS binding in mainQueryConfig.
  const nodes: AceDagNode[] = [
    ...(useDynamicFilterBindings
      ? [
          {
            id: RankQueryNodeId.RankSelection,
            type: AceNodeType.Query,
            queryConfig: rankQueryConfig,
          },
        ]
      : []),
    {
      id: RankQueryNodeId.Main,
      type: AceNodeType.Query,
      queryConfig: mainQueryConfig,
    },
    buildOutputNode(MAIN_OUTPUT_NODE_ID, RankQueryNodeId.Main),
  ];

  // Comparison-only Other path:
  // query_rank_selection --NOT_CONTAINS--> query_other -> output_other.
  // Ranked dimensions that show Other are removed from query_other's breakdown,
  // so their complement is returned as an ungrouped remainder aggregate (not a
  // true total — that is query_total below).
  const otherRemainderDimensions = getOtherRemainderDimensions(topNConfigs);
  if (useDynamicFilterBindings && otherRemainderDimensions.length > 0) {
    const remainderDimensions = new Set<RAQIV2Dimension>(otherRemainderDimensions);
    const otherQueryConfig: RankQueryNodeConfig = {
      metric,
      breakdown: toAceQueryBreakdowns(
        apiBreakdown.filter((dimension) => !remainderDimensions.has(dimension)),
      ),
      filters,
      dynamicFilterBindings: buildDynamicOtherRankFilterBindings(topNConfigs),
    };
    nodes.push(
      {
        id: RankQueryNodeId.Other,
        type: AceNodeType.Query,
        queryConfig: otherQueryConfig,
      },
      buildOutputNode(OTHER_OUTPUT_NODE_ID, RankQueryNodeId.Other),
    );
  }

  // Optional independent total path: query_total -> output_total. Unlike
  // query_other, query_total has no rank-selection dynamic filter.
  const durationBucketBreakdowns = apiBreakdown.filter(isDurationBucketDimension);
  const nonDurationBreakdowns = apiBreakdown.filter(
    (dimension) => !isDurationBucketDimension(dimension),
  );
  if (fetchTotalSeries && nonDurationBreakdowns.length > 0) {
    nodes.push(
      {
        id: RankQueryNodeId.Total,
        type: AceNodeType.Query,
        queryConfig: {
          metric,
          breakdown: toAceQueryBreakdowns(durationBucketBreakdowns),
          filters,
        },
      },
      buildOutputNode(TOTAL_OUTPUT_NODE_ID, RankQueryNodeId.Total),
    );
  }

  const graph: AceDagGraph = {
    id: `standard_rank_${metric}`,
    name: 'Standard Rank DAG',
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

/**
 * The comparison DAG ranks over the primary window while querying the combined
 * span, which only works when every TopN config pins an explicit order window.
 */
const canUsePrimaryWindowRankComparison = (
  topNConfigs: readonly RankTopNConfig[],
): topNConfigs is readonly PinnedRankTopNConfig[] => topNConfigs.every(isPinnedRankTopNConfig);

/**
 * Executes the rank DAG. Non-comparison runs over the request window.
 * Comparison stretches the DAG to [comparisonStart, primaryEnd], enables
 * dynamic filter bindings, then slices the combined response into primary /
 * comparison (+ totals).
 */
const executeStandardRankAceRequest = async ({
  clients,
  request,
  metric,
  apiBreakdown,
  topNConfigs,
  fetchTotalSeries,
  comparison,
}: {
  clients: ACERequestClients;
  request: RankDagRequestSpec;
  metric: TRAQIV2APIMetric;
  apiBreakdown: readonly RAQIV2Dimension[];
  topNConfigs: readonly RankTopNConfig[];
  fetchTotalSeries?: boolean;
  comparison?: ComparisonRangeSpec;
}): Promise<RAQIV2QueryResponses> => {
  if (comparison === undefined) {
    return makeACERequest(
      clients,
      buildStandardRankDagRequest({
        request,
        metric,
        apiBreakdown,
        topNConfigs,
        fetchTotalSeries,
      }),
    );
  }

  const { comparisonStartDate, comparisonEndDate } = getComparisonRange(
    request.timeSpec.startTime,
    request.timeSpec.endTime,
    comparison.granularity,
    comparison.relativeOffset,
    comparison.customStartDate,
  );
  const combined = await makeACERequest(
    clients,
    buildStandardRankDagRequest({
      request: {
        ...request,
        timeSpec: {
          ...request.timeSpec,
          startTime: comparisonStartDate,
          endTime: request.timeSpec.endTime,
        },
      },
      metric,
      apiBreakdown,
      topNConfigs,
      fetchTotalSeries,
      useDynamicFilterBindings: true,
    }),
    {
      adaptResult: adaptStandardRankDagResponseToRAQIV2Result(
        getOtherRemainderDimensions(topNConfigs),
      ),
    },
  );

  return {
    response: combined.response
      ? sliceRAQIV2QueryResultByTimeRange(
          combined.response,
          request.timeSpec.startTime,
          request.timeSpec.endTime,
        )
      : null,
    comparisonResponse: combined.response
      ? sliceRAQIV2QueryResultByTimeRange(combined.response, comparisonStartDate, comparisonEndDate)
      : undefined,
    totalSeriesResponse: combined.totalSeriesResponse
      ? sliceRAQIV2QueryResultByTimeRange(
          combined.totalSeriesResponse,
          request.timeSpec.startTime,
          request.timeSpec.endTime,
        )
      : undefined,
    totalSeriesComparisonResponse: combined.totalSeriesResponse
      ? sliceRAQIV2QueryResultByTimeRange(
          combined.totalSeriesResponse,
          comparisonStartDate,
          comparisonEndDate,
        )
      : undefined,
  };
};

/**
 * Attempts the ACE TopN / rank path for a standard metric request.
 * Returns `null` when ineligible so the caller can use the legacy FE TopN path.
 */
const makeTopNRankAceRequest = async ({
  clients,
  request,
  metric,
  apiBreakdown,
  topNBreakdownConfigs,
  fetchTotalSeries,
  comparison,
  legacyOnlyFeatures,
}: MakeTopNRankAceRequestParams): Promise<RAQIV2QueryResponses | null> => {
  const aceTopNConfigs = topNBreakdownConfigs.map((config) =>
    topNPseudoDimensionToAceConfigForRequest(config, request.timeSpec, comparison),
  );
  const canUseAceRankBreakdownSpec =
    aceTopNConfigs.length > 0 &&
    (comparison === undefined || canUsePrimaryWindowRankComparison(aceTopNConfigs)) &&
    !Object.values(legacyOnlyFeatures).some(Boolean);

  if (!canUseAceRankBreakdownSpec) {
    return null;
  }

  const rankApiBreakdown = [...apiBreakdown, ...aceTopNConfigs.map((config) => config.dimension)];

  return executeStandardRankAceRequest({
    clients,
    request,
    metric,
    apiBreakdown: rankApiBreakdown,
    topNConfigs: aceTopNConfigs,
    fetchTotalSeries,
    comparison,
  });
};

export default makeTopNRankAceRequest;
