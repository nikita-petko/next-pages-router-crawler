import type { AnalyticsQueryGatewayExecuteDagResult } from '@modules/clients/analytics/analyticsQueryGateway';

export type ComputedMetricDagExecutionErrorDetails = {
  message: string;
  code: string | undefined;
  severity: string | undefined;
  nodeId: string | undefined;
  suggestion: string | undefined;
  operationId: string | undefined;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
};

// Reads the first DagError off the response and projects its structured
// fields into the shape `ComputedMetricDagExecutionError` consumes. No
// regex; no message parsing. When the field set on the wire grows (e.g. the
// proto change in DSA-5742 adds typed `details`), expand this projection
// rather than re-parsing strings downstream.
const getComputedMetricDagExecutionError = (
  response: AnalyticsQueryGatewayExecuteDagResult,
): ComputedMetricDagExecutionErrorDetails | null => {
  const generatedError = response.result?.errors?.find(
    (entry) => toStringValue(entry.message) ?? toStringValue(entry.code),
  );
  if (!generatedError) {
    return null;
  }

  return {
    message:
      toStringValue(generatedError.message) ??
      toStringValue(generatedError.code) ??
      'Computed metric execution failed',
    code: toStringValue(generatedError.code),
    severity: toStringValue(generatedError.severity),
    nodeId: toStringValue(generatedError.nodeId),
    suggestion: toStringValue(generatedError.suggestion),
    operationId: toStringValue(response.operationId),
  };
};

export default getComputedMetricDagExecutionError;
