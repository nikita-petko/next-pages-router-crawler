import React from 'react';
import {
  AnalyticsComponentType,
  ArbitraryComponentConfig,
} from '@modules/experience-analytics-shared';
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

export default { arbitraryComponentConfigSimilarExperiencesCards };
