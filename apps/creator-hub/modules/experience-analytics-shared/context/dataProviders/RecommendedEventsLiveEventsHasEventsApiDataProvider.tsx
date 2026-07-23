import React, { FC, useCallback } from 'react';
import { RecommendedEventType } from '@modules/clients/analytics';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';
import getAnalyticsApiDataProvider from './AnalyticsApiDataProvider';
import { useRecommendedEventsLiveStatsClient } from '../RecommendedEventsLiveStatsClientProvider';

const {
  useAnalyticsApiData: useRecommendedEventsLiveEventsHasEventsApiData,
  AnalyticsApiDataProvider,
} = getAnalyticsApiDataProvider<boolean>();

// NOTE(shumingxu, 03/28/2024): We need an additional check to see if there are any live events without filters to
// distinguish not having any events vs having events but they are filtered out.
export const RecommendedEventsLiveEventsHasEventsApiDataContextProvider: FC<
  React.PropsWithChildren
> = ({ children }) => {
  const liveStatsClient = useRecommendedEventsLiveStatsClient();
  const { id: universeId } = useUniverseResource();

  const fetchLiveEvents = useCallback(async () => {
    const eventTypesToCheck = [
      RecommendedEventType.EconomyEvents,
      RecommendedEventType.ProgressionEvents,
      RecommendedEventType.CustomEvents,
    ];
    const requests = eventTypesToCheck.map((eventType) =>
      liveStatsClient.getLiveEvents({
        universeId,
        pageSize: 1,
        eventType,
      }),
    );

    const responses = await Promise.allSettled(requests);
    const hasEvents = responses.some(
      (response) =>
        response.status === 'fulfilled' &&
        response.value.analyticsEvent?.length !== undefined &&
        response.value.analyticsEvent.length > 0,
    );
    return hasEvents;
  }, [liveStatsClient, universeId]);

  return (
    <AnalyticsApiDataProvider
      fetchApi={fetchLiveEvents}
      options={{ refetchShouldSetLoading: true }}>
      {children}
    </AnalyticsApiDataProvider>
  );
};

export default RecommendedEventsLiveEventsHasEventsApiDataContextProvider;
export { useRecommendedEventsLiveEventsHasEventsApiData };
