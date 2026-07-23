import { CreatorRoadmapApi } from '@rbx/client-feedback-gateway-api/v1';
import type CreatorRoadmapVoteOptions from '@modules/roadMap/v2/creatorRoadmapVoteOptions';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('feedback', 'bedev2');

const creatorRoadmapApi = new CreatorRoadmapApi(configuration);

export const createRoadmapFeedback = async ({
  itemId,
  voteType,
  voteOptions,
  description,
}: {
  itemId: string;
  voteType: 'Upvote' | 'Downvote';
  voteOptions: CreatorRoadmapVoteOptions[];
  description: string;
}) => {
  await creatorRoadmapApi.creatorRoadmapCreateCreatorRoadmapIssue({
    analyticsAssistantCreateAnalyticsAssistantIssueRequest: {
      externalId: itemId,
      voteType,
      voteOptions,
      description,
    },
  });
};

export default createRoadmapFeedback;
