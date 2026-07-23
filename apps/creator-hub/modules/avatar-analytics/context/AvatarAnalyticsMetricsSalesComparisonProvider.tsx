import { AvatarItemMetric } from '@modules/clients/analytics';
import getAnalyticsMetricsDataProvider from './AvatarAnalyticsMetricsProvider';

export const {
  useAvatarAnalyticsMetricsData: useAvatarAnalyticsMetricsSalesComparisonData,
  AvatarAnalyticsMetricsProvider: AvatarAnalyticsMetricsSalesComparisonProvider,
} = getAnalyticsMetricsDataProvider({
  metric: AvatarItemMetric.SalesCount,
  isComparison: true,
});
