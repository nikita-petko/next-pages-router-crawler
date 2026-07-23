export default class GenerateMetricsSummaryTimeoutError extends Error {
  public status = 504; // Gateway Timeout

  constructor(message?: string) {
    super(message || 'Upstream request timeout - retrying');
    this.name = 'GenerateMetricsSummaryTimeoutError';
  }
}
