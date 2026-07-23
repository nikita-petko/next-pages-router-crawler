import { mapChartResourceTypeToTargetResourceType } from '@modules/clients/analytics/analyticsRAQIShared';
import type { AnalyticsQueryGatewayExecuteDagRequest } from '@modules/clients/analytics/analyticsQueryGateway';
import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import {
  NodeType as AceNodeType,
  ResourceType as AceResourceType,
  WindowReducer,
  DagNode as AceDagNode,
  DagGraph as AceDagGraph,
  DagExecutionContext as AceDagExecutionContext,
  type ConstantNodeConfig,
  type MathNodeConfig,
  type OutputConfig,
  type QueryFilter,
  type QueryBreakdown,
  type QueryNodeConfig,
  type RollingWindowConfig,
} from '@rbx/client-analytics-query-gateway/v1';
import { RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import type { RAQIV2UIQueryRequest } from '../../types/RAQIV2UIQueryRequest';
import { type TRAQIV2NumericUIMetric } from '../../constants/AnalyticsMetricDisplayConfig';
import type { ComputedMetric } from '../../types/ComputedMetric';
import { parseComputedMetricFormula, type FormulaAstNode } from './parseComputedMetricFormula';
import getAPIMetricFromUIMetric from '../getAPIMetricFromUIMetric';

// Computed metrics only support this subset of ACE DAG node operations.
type DagNodeType =
  | typeof AceNodeType.Query
  | typeof AceNodeType.Constant
  | typeof AceNodeType.Add
  | typeof AceNodeType.Subtract
  | typeof AceNodeType.Multiply
  | typeof AceNodeType.Divide
  | typeof AceNodeType.RollingWindow
  | typeof AceNodeType.Output;

type DagWindowReducer = typeof WindowReducer.Avg;

export type ComputedMetricDagRequest = AnalyticsQueryGatewayExecuteDagRequest;

type SupportedDagNode = AceDagNode & {
  type: DagNodeType;
  queryConfig?: QueryNodeConfig;
  constantConfig?: ConstantNodeConfig;
  mathConfig?: MathNodeConfig;
  rollingWindowConfig?: RollingWindowConfig & { reducer: DagWindowReducer };
  outputConfig?: OutputConfig;
};

const operatorToNodeType: Record<'+' | '-' | '*' | '/', DagNodeType> = {
  '+': AceNodeType.Add,
  '-': AceNodeType.Subtract,
  '*': AceNodeType.Multiply,
  '/': AceNodeType.Divide,
};

const toQueryBreakdowns = (
  breakdown: RAQIV2UIQueryRequest['breakdown'],
): QueryBreakdown[] | undefined => {
  if (!breakdown || breakdown.length === 0) {
    return undefined;
  }
  return breakdown.map((dimension) => ({ dimensions: [dimension] }));
};

const buildExpressionNodes = (
  ast: FormulaAstNode,
  nodeByVariable: Map<string, string>,
  nodes: SupportedDagNode[],
  counterHelpers: { nextMath: () => number; nextConstant: () => number },
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
      const nodeId = `const_${counterHelpers.nextConstant()}`;
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
      const leftNodeId = buildExpressionNodes(ast.left, nodeByVariable, nodes, counterHelpers);
      const rightNodeId = buildExpressionNodes(ast.right, nodeByVariable, nodes, counterHelpers);
      const nodeId = `math_${counterHelpers.nextMath()}`;
      nodes.push({
        id: nodeId,
        type: operatorToNodeType[ast.operator],
        mathConfig: {
          inputs: [leftNodeId, rightNodeId],
        },
      });
      return nodeId;
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

export const buildComputedMetricDag = (
  request: RAQIV2UIQueryRequest & { metric: ComputedMetric<TRAQIV2NumericUIMetric> },
): ComputedMetricDagRequest => {
  const { metric: computedMetric } = request;
  const sourceKeys = computedMetric.sources.map((source) => source.key);
  const parseResult = parseComputedMetricFormula(computedMetric.formula, sourceKeys);
  if (!parseResult.ok) {
    throw new Error(parseResult.errors.join('; '));
  }

  const nodes: SupportedDagNode[] = [];
  const nodeByVariable = new Map<string, string>();
  const seenVariableKeys = new Set<string>();
  const queryBreakdowns = toQueryBreakdowns(request.breakdown);

  computedMetric.sources.forEach((source) => {
    if (seenVariableKeys.has(source.key)) {
      throw new Error(`Duplicate variable key "${source.key}" in computed metric`);
    }
    seenVariableKeys.add(source.key);

    const queryNodeId = `query_${source.key}`;
    nodeByVariable.set(source.key, queryNodeId);

    const resolvedMetric = isValidEnumValue(RAQIV2UIMetric, source.metric)
      ? getAPIMetricFromUIMetric(source.metric as RAQIV2UIMetric, {
          percentileType: null,
          aggregationType: null,
        })
      : source.metric;

    nodes.push({
      id: queryNodeId,
      type: AceNodeType.Query,
      queryConfig: {
        metric: resolvedMetric,
        breakdown: queryBreakdowns,
        filters: mergeSourceAndDagLevelFilters(source.filters, request.filter),
      },
    });
  });

  let mathCounter = 0;
  let constantCounter = 0;
  const rawResultNodeId = buildExpressionNodes(parseResult.ast, nodeByVariable, nodes, {
    nextMath: () => {
      mathCounter += 1;
      return mathCounter;
    },
    nextConstant: () => {
      constantCounter += 1;
      return constantCounter;
    },
  });

  let outputInputNodeId = rawResultNodeId;
  if (computedMetric.l7Smoothing) {
    const smoothingNodeId = 'rolling_l7_avg';
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

  const outputAlias = `computed_${computedMetric.sources.map((source) => source.key).join('_')}`;
  nodes.push({
    id: 'output_1',
    type: AceNodeType.Output,
    outputConfig: {
      input: outputInputNodeId,
      alias: outputAlias,
    },
  });

  const graph: AceDagGraph = {
    id: `computed_metric_${outputAlias}`,
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
