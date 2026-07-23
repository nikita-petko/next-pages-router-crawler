import type { AnalyticsQueryGatewayExecuteDagResult } from '@modules/clients/analytics/analyticsQueryGateway';
import type { RAQIV2QueryResponses } from '../combineRAQIV2QueryResponses';
import { MAIN_OUTPUT_NODE_ID, TOTAL_OUTPUT_NODE_ID } from './buildComputedMetricDag';

/**
 * Adapts ACE DAG execution output into the RAQI response shape used by chart
 * consumers. `output_main` carries the requested series, while optional
 * `output_total` carries the companion total series.
 */
const adaptExecuteDagResponseToRAQIV2Result = (
  response: AnalyticsQueryGatewayExecuteDagResult,
): RAQIV2QueryResponses | null => {
  const outputs = response.result?.outputs;
  if (!outputs || outputs.length === 0) {
    return null;
  }

  if (outputs.length > 2) {
    throw new Error(
      `Computed metric DAG expected at most two output nodes, received ${outputs.length}`,
    );
  }

  const mainOutput = outputs.find((output) => output.nodeId === MAIN_OUTPUT_NODE_ID);
  const totalOutput = outputs.find((output) => output.nodeId === TOTAL_OUTPUT_NODE_ID);

  // Tolerate single-output responses with no recognized nodeId (older DAGs and
  // back-end mocks that omit the field) by treating the lone output as main.
  const fallbackMain =
    mainOutput === undefined && totalOutput === undefined && outputs.length === 1
      ? outputs[0]
      : undefined;
  const resolvedMain = mainOutput ?? fallbackMain;

  const mainValues = resolvedMain?.timeSeries?.values;
  if (!mainValues || !Array.isArray(mainValues)) {
    return null;
  }

  const result: RAQIV2QueryResponses = {
    response: { values: mainValues },
  };

  const totalValues = totalOutput?.timeSeries?.values;
  if (totalValues && Array.isArray(totalValues)) {
    result.totalSeriesResponse = { values: totalValues };
  }

  return result;
};

export default adaptExecuteDagResponseToRAQIV2Result;
