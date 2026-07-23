import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import RecommendationServiceEmptyState from './recommendationServicePageEmptyState';

const arbitraryComponentConfigRecommendationServiceEmptyState = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <RecommendationServiceEmptyState />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export default arbitraryComponentConfigRecommendationServiceEmptyState;
