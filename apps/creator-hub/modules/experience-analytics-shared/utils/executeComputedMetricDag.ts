import type { RAQIV2QueryResult } from '@modules/clients/analytics';
import {
  poll,
  type RAQIClientOptions,
  type TRAQIOperation,
} from '@modules/clients/analytics/RAQIPolling';
import type {
  AnalyticsQueryGatewayClientWrapper,
  AnalyticsQueryGatewayExecuteDagRequest,
  AnalyticsQueryGatewayExecuteDagResult,
} from '@modules/clients/analytics/analyticsQueryGateway';
import adaptComputedMetricDagResultToRAQIV2Result from './computedMetrics/adaptComputedMetricDagResultToRAQIV2Result';

const computedMetricExecutionPollOptions: RAQIClientOptions = {
  maxAttempts: 6,
  intialPollingInterval: 300,
  maxAccumulativeDelayToStartBackoff: 1200,
};

export type ComputedMetricDagClients = {
  platformGatewayRAQIClient: Pick<AnalyticsQueryGatewayClientWrapper, 'executeDag'>;
};

const getDagExecutionErrorMessage = (
  response: AnalyticsQueryGatewayExecuteDagResult,
): string | null => {
  const generatedError = response.result?.errors?.find(
    (entry) => typeof entry.message === 'string' || typeof entry.code === 'string',
  );
  if (!generatedError) {
    return null;
  }
  const message = generatedError.message ?? generatedError.code;
  return typeof message === 'string' && message.length > 0
    ? message
    : 'Computed metric execution failed';
};

const toPollingOperation = (
  response: AnalyticsQueryGatewayExecuteDagResult,
): TRAQIOperation<AnalyticsQueryGatewayExecuteDagResult> => {
  const executionError = getDagExecutionErrorMessage(response);
  const hasOutputs = Boolean(response.result?.outputs?.length);
  const done = response.pending === false || hasOutputs || Boolean(executionError);
  return {
    ...response,
    done,
    error: executionError ? { message: executionError } : undefined,
  };
};

const executeComputedMetricDag = async (
  clients: ComputedMetricDagClients,
  dagRequest: AnalyticsQueryGatewayExecuteDagRequest,
): Promise<RAQIV2QueryResult> => {
  return poll(
    async () => {
      const response = await clients.platformGatewayRAQIClient.executeDag(dagRequest);
      return toPollingOperation(response);
    },
    computedMetricExecutionPollOptions,
    (operation) => {
      if (operation.error?.message) {
        throw new Error(`Computed metric execution failed: ${operation.error.message}`);
      }
      const adaptedResult = adaptComputedMetricDagResultToRAQIV2Result(operation);
      if (!adaptedResult) {
        throw new Error('Computed metric execution did not produce any query results');
      }
      return adaptedResult;
    },
  );
};

export default executeComputedMetricDag;
