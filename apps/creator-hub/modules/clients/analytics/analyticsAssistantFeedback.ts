import { AnalyticsAssistantApi } from '@rbx/clients/feedbackGatewayApi';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV2ServiceBasePath } from '../utils';

const basePath = getBEDEV2ServiceBasePath('feedback');

const configuration = new Configuration({
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

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
  try {
    const analyticsAssistantCreateAnalyticsAssistantIssueRequest = {
      url,
      externalId: feedbackId,
      voteOptions: [feedbackOption],
      description: feedbackDetails,
    };
    const data = await analyticsAssistantApi.analyticsAssistantCreateAnalyticsAssistantIssue({
      analyticsAssistantCreateAnalyticsAssistantIssueRequest,
    });
    return data;
  } catch (err) {
    return Promise.reject(err);
  }
};

export default createAnalyticsAssistantFeedback;
