import AceDagExecutionError, { type AceDagExecutionErrorDetails } from './AceDagExecutionError';

// Metric-variant fanout (DSA-5784) specialization of the shared ACE DAG
// execution error. Distinct `name` / message prefix keep operator- and
// Sentry-facing output accurate: a percentile/aggregation fanout failure is
// reported as a variant fanout failure rather than a computed-metric failure.
// Routes through the same `isAceDagExecutionError` handling as computed-metric
// errors (graceful chart abnormal state + structured Sentry fields).
export default class VariantFanoutDagExecutionError extends AceDagExecutionError {
  constructor(details: AceDagExecutionErrorDetails) {
    super(
      `Metric variant fanout execution failed: ${details.message}`,
      'VariantFanoutDagExecutionError',
      details,
    );
  }
}
