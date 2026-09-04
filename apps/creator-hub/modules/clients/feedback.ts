import type { CreateLocalizationFeedbackRequestLocalizationFeedback } from '@rbx/client-feedback-api/v1';
import {
  FeedbackContentType,
  FeedbackIngestionApi,
  ReasonType,
  ServiceSourceType,
} from '@rbx/client-feedback-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export { ReasonType, FeedbackContentType, ServiceSourceType };
export type LocalizationFeedback = CreateLocalizationFeedbackRequestLocalizationFeedback;

class FeedbackClient {
  private feedbackIngestionApi: FeedbackIngestionApi;

  constructor() {
    const configuration = createClientConfiguration('feedback-api', 'bedev2');
    this.feedbackIngestionApi = new FeedbackIngestionApi(configuration);
  }

  async createLocalizationFeedback(localizationFeedback: LocalizationFeedback): Promise<void> {
    await this.feedbackIngestionApi.feedbackIngestionCreateLocalizationFeedback({
      feedbackIngestionCreateLocalizationFeedbackRequest: { localizationFeedback },
    });
  }
}

const feedbackClient = new FeedbackClient();

export default feedbackClient;
