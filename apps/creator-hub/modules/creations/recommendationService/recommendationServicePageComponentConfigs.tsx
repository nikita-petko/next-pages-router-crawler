import React from 'react';
import {
  AnalyticsComponentType,
  ArbitraryComponentConfig,
} from '@modules/experience-analytics-shared';
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
