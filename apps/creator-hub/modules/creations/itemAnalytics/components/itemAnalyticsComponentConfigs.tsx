import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import PublishingAdvanceSummaryCard from './PublishingAdvanceSummaryCard';

export const arbitraryComponentConfigPublishingAdvanceMetricsCard = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [
    RAQIV2Metric.ItemPublishAdvance,
    RAQIV2Metric.ItemLifetimeRebateAmount,
    RAQIV2Metric.ItemPublishAdvanceRecoupedPercentage,
  ],
  renderer: {
    type: 'isolated',
    render: () => {
      return <PublishingAdvanceSummaryCard />;
    },
  },
} as const satisfies ArbitraryComponentConfig;
