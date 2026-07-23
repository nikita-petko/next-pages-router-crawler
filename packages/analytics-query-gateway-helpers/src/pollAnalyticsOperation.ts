// Polling + typed-error layer for the asynchronous analytics-query-gateway.
//
// The gateway returns `Operation`s that aren't necessarily `done` on the
// first request and signals failures via `operation.error` on a 2xx
// response, so a plain typed API call is not enough — callers need to
// re-issue the request until the operation resolves and translate
// structured errors into typed exceptions. This module is the canonical
// place that logic lives.

import type { Operation, QueryError } from '@rbx/client-analytics-query-gateway/v1';
import { exponentialBackoffWithJitter } from './exponentialBackoffWithJitter';
import RAQIQueryError, {
  MALFORMED_BACKEND_ERROR_CODE,
  RAQIQueryValidationField,
} from './RAQIQueryError';
import type { RAQIQueryValidationDetails } from './RAQIQueryError';

/**
 * Translate the canonical proto-JSON enum name for `QueryValidationField`
 * to our compact TS enum. Returns `undefined` for unknown / missing /
 * the `QUERY_VALIDATION_FIELD_INVALID` zero-value sentinel so callers
 * gracefully fall back to the generic validation error rather than
 * surfacing an uninterpretable payload.
 *
 * Keep in lockstep with the proto enum (`shared.proto`) and the backend
 * trailer-token mapping. The drift tests in the developer-analytics repo
 * catch drift on the producer/consumer side; this function is the final
 * mile on the client.
 */
const parseValidationFieldFromWire = (
  wireValue: string | undefined,
): RAQIQueryValidationField | undefined => {
  if (wireValue === undefined) {
    return undefined;
  }
  switch (wireValue) {
    case 'QUERY_VALIDATION_FIELD_FILTER':
      return RAQIQueryValidationField.Filter;
    case 'QUERY_VALIDATION_FIELD_BREAKDOWN':
      return RAQIQueryValidationField.Breakdown;
    case 'QUERY_VALIDATION_FIELD_GRANULARITY':
      return RAQIQueryValidationField.Granularity;
    case 'QUERY_VALIDATION_FIELD_TIME_RANGE':
      return RAQIQueryValidationField.TimeRange;
    case 'QUERY_VALIDATION_FIELD_METRIC':
      return RAQIQueryValidationField.Metric;
    default:
      return undefined;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Extract structured validation details from a backend error payload.
 *
 * `QueryError` trails the proto: the openapi-generator package is
 * regenerated out-of-band, so the `validationDetails` field added in
 * `shared.proto` may not be on the compile-time type yet. We therefore
 * narrow the `QueryError` to `Record<string, unknown>` via a runtime
 * guard so the rest of the function can read properties through the
 * type system rather than chained casts, and shape-check each field as
 * we pull it out. That makes us robust to both the codegen gap and a
 * genuinely malformed backend response (we'd rather fall back to the
 * generic error code than construct a half-populated payload).
 *
 * `field` arrives as the canonical proto-JSON enum name
 * (e.g. `"QUERY_VALIDATION_FIELD_FILTER"`); we translate it to the compact
 * `RAQIQueryValidationField` values so the rest of the code (and our
 * Sentry tags) only ever see bounded, Sentry-safe strings.
 */
const extractValidationDetails = (error: QueryError): RAQIQueryValidationDetails | undefined => {
  if (!isObject(error) || !('validationDetails' in error)) {
    return undefined;
  }
  const details = error.validationDetails;
  if (!isObject(details)) {
    return undefined;
  }
  const rawField = typeof details.field === 'string' ? details.field : undefined;
  const field = parseValidationFieldFromWire(rawField);
  const rejectedValues = Array.isArray(details.rejectedValues)
    ? details.rejectedValues.filter((value): value is string => typeof value === 'string')
    : [];
  // A bare field with no rejected values is no more informative than the
  // generic error code — fall back rather than emit a half-populated
  // payload the client would have to special-case.
  if (field === undefined || rejectedValues.length === 0) {
    return undefined;
  }
  return {
    field,
    subject: typeof details.subject === 'string' ? details.subject : '',
    rejectedValues,
  };
};

const BACKOFF_GROWTH_EXPONENT = 2;

/**
 * The polling envelope around a payload `T` that doesn't natively arrive
 * as an `Operation`.
 */
export type TRAQIOperation<T> = Operation & T;

export type RAQIClientOptions = {
  maxAttempts: number;
  initialPollingInterval: number;
  maxAccumulativeDelayToStartBackoff: number;
};

export const ANALYTICS_POLLING_DEFAULTS: RAQIClientOptions = {
  maxAttempts: 12,
  initialPollingInterval: 250,
  maxAccumulativeDelayToStartBackoff: 1000,
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Issue `makeRequest` repeatedly until the returned `Operation` has
 * `done: true`, then either throw a `RAQIQueryError` (`operation.error`)
 * or return the unwrapped result via `operationToResult`.
 *
 * `makeRequest` should re-execute the same backend call on each
 * invocation — the analytics-query-gateway treats the polling path as
 * idempotent. If the operation resolves synchronously (`done: true` on
 * the first response) the inner sleep loop is skipped entirely.
 */
export async function pollAnalyticsOperation<TResult, TOperationResult = unknown>(
  makeRequest: () => Promise<TRAQIOperation<TOperationResult>>,
  operationToResult: (operation: TRAQIOperation<TOperationResult>) => TResult | undefined,
  options: RAQIClientOptions = ANALYTICS_POLLING_DEFAULTS,
): Promise<TResult> {
  let operation = await makeRequest();

  const { maxAttempts, initialPollingInterval, maxAccumulativeDelayToStartBackoff } = options;
  let attempts = 1;
  let accumulativeDelay = 0;

  while (!operation.done) {
    if (attempts > maxAttempts) {
      throw new Error('analytics-query-gateway: reached max polling attempts');
    }

    // Use exponential backoff with jitter once the accumulative delay
    // exceeds the threshold; until then, fixed-interval polling keeps the
    // common-case latency low for queries that finish quickly.
    const delay =
      accumulativeDelay > maxAccumulativeDelayToStartBackoff
        ? exponentialBackoffWithJitter(
            initialPollingInterval,
            BACKOFF_GROWTH_EXPONENT,
            attempts,
            maxAttempts * initialPollingInterval,
          )
        : initialPollingInterval;

    await sleep(delay);
    accumulativeDelay += delay;

    operation = await makeRequest();
    attempts += 1;
  }

  // Backend signals failures via operation.error on a done operation, not
  // a non-2xx HTTP status, so we surface them as a typed error here. If
  // the error payload is missing a `code` the response is malformed (not
  // a real 2000 QueryFailed) — flag it with `MALFORMED_BACKEND_ERROR_CODE`
  // so Sentry can distinguish "we couldn't parse the backend's answer"
  // from a genuine, well-formed failure.
  if (operation.error) {
    throw new RAQIQueryError(
      operation.error.code ?? MALFORMED_BACKEND_ERROR_CODE,
      operation.error.message ?? 'Query failed',
      operation.path,
      extractValidationDetails(operation.error),
    );
  }

  const result = operationToResult(operation);
  if (!result) {
    // Operation is done, has no error, and produced no result. This
    // shouldn't happen if the backend contract is respected; throw a
    // typed error so the UI still picks a deterministic branch instead
    // of falling through. Use the malformed-payload sentinel so it's
    // distinguishable in Sentry from a genuine 2000 QueryFailed.
    throw new RAQIQueryError(
      MALFORMED_BACKEND_ERROR_CODE,
      'Query completed with no result payload',
      operation.path,
    );
  }
  return result;
}
