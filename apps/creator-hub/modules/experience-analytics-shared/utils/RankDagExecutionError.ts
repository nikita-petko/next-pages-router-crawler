import AceDagExecutionError, { type AceDagExecutionErrorDetails } from './AceDagExecutionError';

// TopN / rank breakdown (DSA-6052) specialization of the shared ACE DAG
// execution error. Distinct `name` / message prefix keep operator- and
// Sentry-facing output accurate: a TopN / rank failure is reported as a rank
// failure rather than a computed-metric failure. Routing through the shared
// `isAceDagExecutionError` path (graceful chart abnormal state + structured
// Sentry fields) renders the generic recoverable request-failure copy
// instead of the misleading computed-metric formula message. Mirrors
// `VariantFanoutDagExecutionError` (DSA-5784).
export default class RankDagExecutionError extends AceDagExecutionError {
  constructor(details: AceDagExecutionErrorDetails) {
    super(`Rank/TopN DAG execution failed: ${details.message}`, 'RankDagExecutionError', details);
  }
}
