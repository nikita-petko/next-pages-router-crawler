import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import SimilarExperiencesList from './components/SimilarExperiencesList';

export const arbitraryComponentConfigSimilarExperiencesCards = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <SimilarExperiencesList />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export default {
  arbitraryComponentConfigSimilarExperiencesCards,
};
