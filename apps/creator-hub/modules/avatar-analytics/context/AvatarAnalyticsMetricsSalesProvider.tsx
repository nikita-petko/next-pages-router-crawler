import { AvatarItemMetric } from '@modules/clients/analytics';
import getAnalyticsMetricsDataProvider from './AvatarAnalyticsMetricsProvider';

export const {
  useAvatarAnalyticsMetricsData: useAvatarAnalyticsMetricsSalesData,
  AvatarAnalyticsMetricsProvider: AvatarAnalyticsMetricsSalesProvider,
} = getAnalyticsMetricsDataProvider({
  metric: AvatarItemMetric.SalesCount,
});
