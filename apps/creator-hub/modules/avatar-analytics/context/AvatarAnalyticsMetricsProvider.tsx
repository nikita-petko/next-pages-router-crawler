import React, { FunctionComponent, useCallback, useMemo } from 'react';
import {
  AvatarItemDimension,
  AvatarItemMetric,
  AvatarItemMetricsRequest,
  MetricGranularity,
  RAQIResponse,
} from '@modules/clients/analytics';
import {
  DailyTimeSeriesAlignedToUTCMidnight,
  getComparisonTimeRange,
  validateResponse,
} from '@modules/charts-generic';
import {
  getAnalyticsApiDataProvider,
  useAnalyticsCurrentDateRangeBundle,
  useOwner,
} from '@modules/experience-analytics-shared';
import { useAvatarAnalyticsClient } from './AvatarAnalyticsClientProvider';

type AvatarAnalyticsMetricsProviderSpec = {
  metric: AvatarItemMetric;
  isComparison?: boolean;
};

const getAnalyticsMetricsDataProvider = ({
  metric,
  isComparison,
}: AvatarAnalyticsMetricsProviderSpec) => {
  const { useAnalyticsApiData: useAvatarAnalyticsMetricsData, AnalyticsApiDataProvider } =
    getAnalyticsApiDataProvider<RAQIResponse<AvatarItemDimension>>();

  const AvatarAnalyticsMetricsProvider: FunctionComponent<React.PropsWithChildren> = ({
    children,
  }) => {
    const avatarItemsClient = useAvatarAnalyticsClient();
    const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
    const owner = useOwner();
    const { comparisonStartDate, comparisonEndDate } = useMemo(
      () => getComparisonTimeRange(startDate, endDate, DailyTimeSeriesAlignedToUTCMidnight),
      [startDate, endDate],
    );
    const totalArgs: AvatarItemMetricsRequest | undefined = useMemo(() => {
      if (!owner.isFetched) return undefined;
      return {
        ...owner,
        startTime: isComparison ? comparisonStartDate : startDate,
        endTime: isComparison ? comparisonEndDate : endDate,
        granularity: MetricGranularity.OneDay,
        metric,
      };
    }, [comparisonEndDate, comparisonStartDate, owner, endDate, startDate]);
    const breakdownArgs: AvatarItemMetricsRequest | undefined = useMemo(() => {
      if (!owner.isFetched) return undefined;
      return {
        ...owner,
        startTime: isComparison ? comparisonStartDate : startDate,
        endTime: isComparison ? comparisonEndDate : endDate,
        granularity: MetricGranularity.OneDay,
        breakdown: [AvatarItemDimension.Product],
        metric,
      };
    }, [comparisonEndDate, comparisonStartDate, owner, endDate, startDate]);
    const fetchApi = useCallback(async () => {
      if (!totalArgs || !breakdownArgs) return null;
      const [totalResponse, byProductResponse] = await Promise.all([
        avatarItemsClient.getAvatarItemMetrics(totalArgs),
        avatarItemsClient.getAvatarItemMetrics(breakdownArgs),
      ]);
      const response = {
        values: [...(totalResponse.values || []), ...(byProductResponse.values || [])],
      };
      if (response) {
        return validateResponse(response, { dimensionEnum: AvatarItemDimension });
      }
      return null;
    }, [avatarItemsClient, totalArgs, breakdownArgs]);
    return <AnalyticsApiDataProvider fetchApi={fetchApi}>{children}</AnalyticsApiDataProvider>;
  };

  return {
    useAvatarAnalyticsMetricsData,
    AvatarAnalyticsMetricsProvider,
  };
};

export default getAnalyticsMetricsDataProvider;
