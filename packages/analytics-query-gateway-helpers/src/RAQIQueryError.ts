/**
 * Error codes emitted by the analytics-query-operations backend in the
 * `Operation.error.code` field of a query/dimension/metadata response.
 *
 * Keep in sync with services/analytics-query-operations/src/Handler/OperationErrorHandling.cs
 * in the developer-analytics repo.
 */
export enum RAQIQueryErrorCode {
  QueryFailed = 2000,
  QueryValidationFailed = 2001,
  QueryTransientFailure = 2002,
}

/**
 * Sentinel used when the backend responded with `done: true` but the
 * payload wasn't something we could interpret (missing error code, missing
 * result payload, etc.). Intentionally negative so it never collides with
 * a real backend code, and intentionally NOT a member of
 * `RAQIQueryErrorCode` so `isKnownCode` stays false — that gives
 * Sentry a clean `code-known: false` signal to triage malformed backend
 * responses separately from genuine 2000s.
 */
export const MALFORMED_BACKEND_ERROR_CODE = -1;

/**
 * Which request field the backend flagged as the cause of a
 * `QueryValidationFailed` response. Mirrors the proto `QueryValidationField`
 * enum in `shared.proto`.
 *
 * Values are kept short and stable so they can safely be used as
 * bounded-cardinality labels in Sentry/metrics — production code should
 * never read a raw proto enum name string. The wire format (canonical
 * proto JSON, e.g. `"QUERY_VALIDATION_FIELD_FILTER"`) is translated to
 * these values at the extractor boundary in `pollAnalyticsOperation`.
 *
 * When adding a new variant, update:
 *   1. The proto enum (`protos/.../shared.proto`).
 *   2. The engine producer + operations consumer token mappings (see
 *      drift tests in the backend repo).
 *   3. `parseValidationFieldFromWire` in `pollAnalyticsOperation`.
 */
export enum RAQIQueryValidationField {
  Filter = 'filter',
  Breakdown = 'breakdown',
  Granularity = 'granularity',
  TimeRange = 'timeRange',
  Metric = 'metric',
}

/**
 * Structured details for `QueryValidationFailed` when the backend was able
 * to attribute the failure to a specific request input. Mirrors the proto
 * `QueryValidationDetails` message in `shared.proto`.
 *
 * Per-field semantics — `subject` and `rejectedValues` interpretation
 * depends on `field`:
 *   - `Filter`      — `subject` is the dimension name; `rejectedValues` is
 *                     the subset of the caller's filter values that were
 *                     rejected.
 *   - `Breakdown`   — `subject` is the dimension name (if known);
 *                     `rejectedValues` lists the rejected breakdown names.
 *   - `Granularity` — `subject` is empty; `rejectedValues` contains the
 *                     requested granularity enum name.
 *   - `TimeRange`   — `subject` is empty; `rejectedValues` describes the
 *                     offending constraint.
 *   - `Metric`      — `subject` is empty; `rejectedValues` contains the
 *                     requested metric name.
 *
 * Every field is a concept the caller already owns (it came from their
 * request), so the payload is safe to surface to end users.
 */
export type RAQIQueryValidationDetails = {
  field: RAQIQueryValidationField;
  subject: string;
  rejectedValues: string[];
};

/**
 * Typed error thrown by `pollAnalyticsOperation` when the backend operation
 * returned an `Operation.error` rather than a successful result.
 *
 * UI code should switch on `code` to pick a translated message; `message`
 * is backend-generated text for logs/developer inspection and is
 * intentionally not shown verbatim to end users. `operationPath` is the
 * backend operation id, used to correlate with the structured error log
 * in Kibana.
 *
 * `validationDetails` is populated for `QueryValidationFailed` when the
 * backend pinpointed a specific request field + values; UI code should use
 * `field` to route to actionable copy instead of the generic fallback.
 * Absence is normal — the backend only attaches details when it knows the
 * offending input.
 */
export default class RAQIQueryError extends Error {
  code: number;

  operationPath?: string;

  validationDetails?: RAQIQueryValidationDetails;

  /** True when `code` corresponds to a known `RAQIQueryErrorCode`. */
  isKnownCode: boolean;

  constructor(
    code: number,
    message: string,
    operationPath?: string,
    validationDetails?: RAQIQueryValidationDetails,
  ) {
    super(message);
    Object.setPrototypeOf(this, RAQIQueryError.prototype);
    this.name = 'RAQIQueryError';
    this.code = code;
    this.operationPath = operationPath;
    this.validationDetails = validationDetails;
    // `in` checks the reverse-mapping object TS emits for numeric enums,
    // which is both more explicit and cheaper than materializing
    // Object.values() on every throw.
    this.isKnownCode = code in RAQIQueryErrorCode;
  }
}

export const isRAQIQueryError = (e: unknown): e is RAQIQueryError => e instanceof RAQIQueryError;
