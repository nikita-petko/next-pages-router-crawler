import React, { FC, useCallback } from 'react';
import { GetLiveEventsResponse, RecommendedEventType } from '@modules/clients/analytics';
import {
  getFilterValueForDimension,
  NonRAQIUIDimension,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { recommendedEventsLiveEventsFilterDimensions } from '../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarConfig';
import getAnalyticsApiDataProvider from './AnalyticsApiDataProvider';
import { useRecommendedEventsLiveStatsClient } from '../RecommendedEventsLiveStatsClientProvider';
import { useNonRAQIAnalyticsCurrentFilterBundle } from '../AnalyticsCurrentFilterBundleProvider';
import { useUniverseResource } from '../../hooks/useChartResourceProvider';

const MaxLiveEventsToShow = 100;

const { useAnalyticsApiData: useRecommendedEventsLiveEventsApiData, AnalyticsApiDataProvider } =
  getAnalyticsApiDataProvider<GetLiveEventsResponse>();

const RecommendedEventsLiveEventsApiDataContextProvider: FC<
  React.PropsWithChildren<{
    defaultEventType: RecommendedEventType;
  }>
> = ({ children, defaultEventType }) => {
  const liveStatsClient = useRecommendedEventsLiveStatsClient();
  const { id: universeId } = useUniverseResource();
  const { filters } = useNonRAQIAnalyticsCurrentFilterBundle(
    recommendedEventsLiveEventsFilterDimensions,
  );
  const eventTypeFilterValue = getFilterValueForDimension<RecommendedEventType>(
    filters,
    NonRAQIUIDimension.LiveEventType,
    defaultEventType,
  );
  const fetchLiveEvents = useCallback(
    () =>
      liveStatsClient.getLiveEvents({
        universeId,
        eventType: eventTypeFilterValue ?? undefined,
        pageSize: MaxLiveEventsToShow,
      }),
    [eventTypeFilterValue, liveStatsClient, universeId],
  );

  return (
    <AnalyticsApiDataProvider
      fetchApi={fetchLiveEvents}
      options={{ refetchShouldSetLoading: true }}>
      {children}
    </AnalyticsApiDataProvider>
  );
};

export default RecommendedEventsLiveEventsApiDataContextProvider;
export { useRecommendedEventsLiveEventsApiData };
