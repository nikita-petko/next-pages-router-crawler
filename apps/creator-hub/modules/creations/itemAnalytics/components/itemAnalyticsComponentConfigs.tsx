import React from 'react';
import {
  AnalyticsComponentType,
  ArbitraryComponentConfig,
} from '@modules/experience-analytics-shared';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
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

export default { arbitraryComponentConfigPublishingAdvanceMetricsCard };
