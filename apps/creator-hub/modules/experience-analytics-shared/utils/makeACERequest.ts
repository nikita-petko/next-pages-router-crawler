import {
  pollAnalyticsOperation,
  type RAQIClientOptions,
  RAQIQueryError,
  type TRAQIOperation,
} from '@rbx/analytics-query-gateway-helpers';
import type {
  AnalyticsQueryGatewayClientWrapper,
  AnalyticsQueryGatewayExecuteDagRequest,
  AnalyticsQueryGatewayExecuteDagResult,
} from '@modules/clients/analytics/analyticsQueryGateway';
import type AceDagExecutionError from './AceDagExecutionError';
import type { AceDagExecutionErrorDetails } from './AceDagExecutionError';
import type { RAQIV2QueryResponses } from './combineRAQIV2QueryResponses';
import adaptExecuteDagResponseToRAQIV2Result from './computedMetrics/adaptExecuteDagResponseToRAQIV2Result';
import ComputedMetricDagExecutionError from './computedMetrics/ComputedMetricDagExecutionError';
import getComputedMetricDagExecutionError from './computedMetrics/getComputedMetricDagExecutionError';

// Maps structured DAG error fields to a typed, kind-specific ACE error.
// Defaults to the computed-metric error so existing callers are unchanged;
// the variant fanout path supplies its own factory (DSA-5784) so failures are
// labeled accurately for operators/Sentry.
export type AceDagExecutionErrorFactory = (
  details: AceDagExecutionErrorDetails,
) => AceDagExecutionError;

const defaultExecutionErrorFactory: AceDagExecutionErrorFactory = (details) =>
  new ComputedMetricDagExecutionError(details);

const aceDagExecutionPollOptions: RAQIClientOptions = {
  maxAttempts: 6,
  initialPollingInterval: 300,
  maxAccumulativeDelayToStartBackoff: 1200,
};

export type ACERequestClients = {
  platformGatewayRAQIClient: Pick<AnalyticsQueryGatewayClientWrapper, 'executeDag'>;
};

type DagResultAdapter<TResult> = (
  response: AnalyticsQueryGatewayExecuteDagResult,
) => TResult | null;

const toPollingOperation = (
  response: AnalyticsQueryGatewayExecuteDagResult,
): TRAQIOperation<AnalyticsQueryGatewayExecuteDagResult> => {
  const hasExecutionError = (response.result?.errors?.length ?? 0) > 0;
  const hasOutputs = Boolean(response.result?.outputs?.length);
  // Mark the operation done when polling should stop. We deliberately do NOT
  // synthesize `operation.error` for DAG execution failures — doing so would
  // cause `poll()` to throw a generic `RAQIQueryError` before the projection
  // callback runs, losing the structured DAG error details (code, severity,
  // suggestion, operationId) that downstream consumers rely on (Sentry tags,
  // chart abnormal-state mapper). Instead, the projection callback inspects
  // the response and throws a typed, ACE-specific error when needed (see
  // `makeACERequest` below).
  const done = response.pending === false || hasOutputs || hasExecutionError;
  return {
    ...response,
    done,
  };
};

export const executeDagRequest = async <TResult>(
  clients: ACERequestClients,
  dagRequest: AnalyticsQueryGatewayExecuteDagRequest,
  adaptResult: DagResultAdapter<TResult>,
  emptyResultMessage = 'ACE DAG execution did not produce any query results',
): Promise<TResult> => {
  return pollAnalyticsOperation(
    async () => {
      const response = await clients.platformGatewayRAQIClient.executeDag(dagRequest);
      return toPollingOperation(response);
    },
    (operation) => {
      const adaptedResult = adaptResult(operation);
      if (adaptedResult == null) {
        throw new Error(emptyResultMessage);
      }
      return adaptedResult;
    },
    aceDagExecutionPollOptions,
  );
};

const makeACERequest = async (
  clients: ACERequestClients,
  dagRequest: AnalyticsQueryGatewayExecuteDagRequest,
  createExecutionError: AceDagExecutionErrorFactory = defaultExecutionErrorFactory,
): Promise<RAQIV2QueryResponses> => {
  try {
    return await executeDagRequest(clients, dagRequest, (response) => {
      // Surface DAG execution failures as a typed ACE error before the
      // happy-path adapter runs. Pre-DSA-5741 this surface synthesized a
      // string error in `toPollingOperation`, which `poll()` raised as
      // `RAQIQueryError`, which was rewrapped here as a bare `TypeError` —
      // and that propagated through `useApiRequest` as an "unknown error",
      // surfacing as a Next.js runtime error overlay (page crash) rather
      // than a graceful chart abnormal state. The typed subclass routes
      // through `useApiRequest`'s `isComputedMetricDagExecutionError`
      // branch (Sentry tags + `setResponseFailure`) and the chart
      // abnormal-state mapper renders ACE-specific copy.
      const executionError = getComputedMetricDagExecutionError(response);
      if (executionError) {
        throw createExecutionError(executionError);
      }
      return adaptExecuteDagResponseToRAQIV2Result(response);
    });
  } catch (err) {
    // Defensive backstop: `pollAnalyticsOperation` raises any `operation.error`
    // as a generic `RAQIQueryError`. The `toPollingOperation` above no longer
    // synthesizes that error for execution failures (so this branch shouldn't
    // fire in practice), but if a backend response shape changes and one slips
    // through — or if the underlying polling contract changes — rewrap it as a
    // typed ACE error rather than letting an opaque `RAQIQueryError` reach the
    // UI layer.
    if (err instanceof RAQIQueryError) {
      throw createExecutionError({
        message: err.message,
        code: undefined,
        severity: undefined,
        nodeId: undefined,
        suggestion: undefined,
        operationId: err.operationPath,
      });
    }
    throw err;
  }
};

export default makeACERequest;
