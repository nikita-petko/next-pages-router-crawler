import { AvatarItemMetric } from '@modules/clients/analytics';
import getAnalyticsMetricsDataProvider from './AvatarAnalyticsMetricsProvider';

export const {
  useAvatarAnalyticsMetricsData: useAvatarAnalyticsMetricsRevenueData,
  AvatarAnalyticsMetricsProvider: AvatarAnalyticsMetricsRevenueProvider,
} = getAnalyticsMetricsDataProvider({
  metric: AvatarItemMetric.Revenue,
});
