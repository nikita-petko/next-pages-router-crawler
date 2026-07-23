import { RecommendedEventType } from '@modules/clients/analytics';
import {
  useApiRequest,
  useRecommendedEventsLiveStatsClient,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import { useCallback } from 'react';

const useHasLiveEvents = (eventType: RecommendedEventType) => {
  const liveStatsClient = useRecommendedEventsLiveStatsClient();
  const { id: universeId } = useUniverseResource();
  const fetchHasLiveEvent = useCallback(async () => {
    const response = await liveStatsClient.getLiveEvents({
      universeId,
      pageSize: 1,
      eventType,
    });
    return response?.analyticsEvent?.length !== undefined && response?.analyticsEvent?.length > 0;
  }, [eventType, liveStatsClient, universeId]);

  return useApiRequest(fetchHasLiveEvent);
};

export default useHasLiveEvents;
