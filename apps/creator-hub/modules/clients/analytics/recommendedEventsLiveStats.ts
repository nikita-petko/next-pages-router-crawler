import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  GetLiveEventsResponse,
  LiveStatsApi,
  LiveStatsGetLiveEventsRequest,
  RecommendedEventType,
} from '@rbx/clients/creatorRecommendedEventsApi';
import { getBEDEV2ServiceBasePath } from '../utils';

const basePath = getBEDEV2ServiceBasePath('creator-recommended-events-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const liveStatsApi = new LiveStatsApi(configuration);

export type RecommendedEventsLiveStatsClientWrapper = {
  getLiveEvents(request: LiveStatsGetLiveEventsRequest): Promise<GetLiveEventsResponse>;
};

export { RecommendedEventType };

export type { LiveStatsGetLiveEventsRequest, GetLiveEventsResponse };

const recommendedEventsLiveStatsClient: RecommendedEventsLiveStatsClientWrapper = {
  getLiveEvents: (request) => {
    return liveStatsApi.liveStatsGetLiveEvents(request);
  },
};

export default recommendedEventsLiveStatsClient;
