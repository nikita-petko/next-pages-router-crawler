import { AnalyticsAssistantApi } from '@rbx/client-feedback-gateway-api/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

const configuration = createClientConfiguration('feedback', 'bedev2');

const analyticsAssistantApi = new AnalyticsAssistantApi(configuration);

export const createAnalyticsAssistantFeedback = async ({
  url,
  feedbackId,
  feedbackOption,
  feedbackDetails,
}: {
  url: string;
  feedbackId: string;
  feedbackOption: string;
  feedbackDetails: string;
}) => {
  const analyticsAssistantCreateAnalyticsAssistantIssueRequest = {
    url,
    externalId: feedbackId,
    voteOptions: [feedbackOption],
    description: feedbackDetails,
  };
  await analyticsAssistantApi.analyticsAssistantCreateAnalyticsAssistantIssue({
    analyticsAssistantCreateAnalyticsAssistantIssueRequest,
  });
};

export default createAnalyticsAssistantFeedback;
