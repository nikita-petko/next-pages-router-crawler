import AceDagExecutionError, { type AceDagExecutionErrorDetails } from '../AceDagExecutionError';

// Computed-metric specialization of the shared ACE DAG execution error.
// Replacing the previous `new TypeError(...)` throw in `makeACERequest` with a
// typed ACE error is the literal fix for DSA-5741 — the bare `TypeError`
// propagated as an "unknown error" through `useApiRequest` and surfaced as a
// Next.js runtime error overlay rather than a graceful chart abnormal state.
// See `AceDagExecutionError` for the shared field/contract documentation.
export default class ComputedMetricDagExecutionError extends AceDagExecutionError {
  constructor(details: AceDagExecutionErrorDetails) {
    super(
      `Computed metric execution failed: ${details.message}`,
      'ComputedMetricDagExecutionError',
      details,
    );
  }
}

export const isComputedMetricDagExecutionError = (
  error: unknown,
): error is ComputedMetricDagExecutionError => error instanceof ComputedMetricDagExecutionError;
