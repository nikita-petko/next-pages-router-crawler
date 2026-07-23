import type {
  GetLiveEventsResponse,
  LiveStatsGetLiveEventsRequest,
} from '@rbx/client-creator-recommended-events-api/v1';
import { LiveStatsApi, RecommendedEventType } from '@rbx/client-creator-recommended-events-api/v1';
import { createClientConfiguration } from '../utils/createClientConfiguration';

const configuration = createClientConfiguration('creator-recommended-events-api', 'bedev2');

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
