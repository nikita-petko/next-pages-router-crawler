import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import GenerativeAIInsightSummaryContainer from './GenerativeAIInsightSummaryContainer';

export const analyticsComponentConfigGenerativeAISummary = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <GenerativeAIInsightSummaryContainer />;
    },
  },
} as const satisfies ArbitraryComponentConfig;
