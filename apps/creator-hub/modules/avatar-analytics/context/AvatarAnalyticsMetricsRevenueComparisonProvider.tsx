import { AvatarItemMetric } from '@modules/clients/analytics';
import getAnalyticsMetricsDataProvider from './AvatarAnalyticsMetricsProvider';

export const {
  useAvatarAnalyticsMetricsData: useAvatarAnalyticsMetricsRevenueComparisonData,
  AvatarAnalyticsMetricsProvider: AvatarAnalyticsMetricsRevenueComparisonProvider,
} = getAnalyticsMetricsDataProvider({
  metric: AvatarItemMetric.Revenue,
  isComparison: true,
});
