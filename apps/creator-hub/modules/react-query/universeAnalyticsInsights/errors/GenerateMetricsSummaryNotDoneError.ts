export default class GenerateMetricsSummaryNotDoneError extends Error {
  public status = 202; // HTTP 202 Accepted - request accepted but not completed

  constructor() {
    super('Metrics summary generation is still in progress');
    this.name = 'GenerateMetricsSummaryNotDoneError';
  }
}
