import type { FC } from 'react';
import React, { useCallback } from 'react';
import type { GetLiveEventsResponse, RecommendedEventType } from '@modules/clients/analytics';
import { useRecommendedEventsLiveStatsClient } from '../RecommendedEventsLiveStatsClientProvider';
import getAnalyticsApiDataProvider from './AnalyticsApiDataProvider';

const MaxLiveEventsToShow = 100;

const { useAnalyticsApiData: useRecommendedEventsLiveEventsApiData, AnalyticsApiDataProvider } =
  getAnalyticsApiDataProvider<GetLiveEventsResponse>();

const RecommendedEventsLiveEventsApiDataContextProvider: FC<
  React.PropsWithChildren<{
    eventType: RecommendedEventType;
    universeId: number;
  }>
> = ({ children, eventType, universeId }) => {
  const liveStatsClient = useRecommendedEventsLiveStatsClient();
  const fetchLiveEvents = useCallback(
    () =>
      liveStatsClient.getLiveEvents({
        universeId,
        eventType,
        pageSize: MaxLiveEventsToShow,
      }),
    [eventType, liveStatsClient, universeId],
  );

  return (
    <AnalyticsApiDataProvider
      fetchApi={fetchLiveEvents}
      options={{ enabled: universeId > 0, refetchShouldSetLoading: true }}>
      {children}
    </AnalyticsApiDataProvider>
  );
};

export default RecommendedEventsLiveEventsApiDataContextProvider;
export { useRecommendedEventsLiveEventsApiData };
