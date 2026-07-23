import type { RAQIV2QueryResult } from '@modules/clients/analytics';
import type { AnalyticsQueryGatewayExecuteDagResult } from '@modules/clients/analytics/analyticsQueryGateway';

const adaptComputedMetricDagResultToRAQIV2Result = (
  response: AnalyticsQueryGatewayExecuteDagResult,
): RAQIV2QueryResult | null => {
  const outputs = response.result?.outputs;
  if (!outputs || outputs.length === 0) {
    return null;
  }

  if (outputs.length > 1) {
    throw new Error(
      `Computed metric DAG expected exactly one output node, received ${outputs.length}`,
    );
  }

  const output = outputs[0];
  const timeSeriesValues = output.timeSeries?.values;
  if (!timeSeriesValues || !Array.isArray(timeSeriesValues)) {
    return null;
  }

  return { values: timeSeriesValues };
};

export default adaptComputedMetricDagResultToRAQIV2Result;
