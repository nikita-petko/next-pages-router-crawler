export type AceDagExecutionErrorDetails = {
  message: string;
  code: string | undefined;
  severity: string | undefined;
  nodeId: string | undefined;
  suggestion: string | undefined;
  operationId: string | undefined;
};

// Shared base for failures originating in the Analytics Composition Engine
// (ACE) DAG execution path. Both computed-metric DAGs and metric-variant
// fanout DAGs go through `makeACERequest`, so they share this typed error so
// `useApiRequest` (Sentry tagging + graceful failure) and the chart
// abnormal-state mapper can route any ACE failure uniformly via
// `isAceDagExecutionError`. Concrete subclasses set a kind-specific `name`
// and message prefix so operator/Sentry-facing output stays accurate (e.g. a
// variant fanout failure is not mislabeled as a computed-metric failure).
//
// Structured fields (`code`, `severity`, `nodeId`, `suggestion`,
// `operationId`) come from `DagError` on the wire (see ACE's `dag.proto`) and
// are passed through verbatim. None of this code parses `message`; that is
// operator/Sentry-facing only.
export default class AceDagExecutionError extends Error {
  code: string | undefined;

  severity: string | undefined;

  nodeId: string | undefined;

  suggestion: string | undefined;

  operationId: string | undefined;

  constructor(message: string, name: string, details: AceDagExecutionErrorDetails) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.code = details.code;
    this.severity = details.severity;
    this.nodeId = details.nodeId;
    this.suggestion = details.suggestion;
    this.operationId = details.operationId;
  }
}

export const isAceDagExecutionError = (error: unknown): error is AceDagExecutionError =>
  error instanceof AceDagExecutionError;
