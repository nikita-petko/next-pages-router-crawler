import React from 'react';
import { translationKey } from '@modules/analytics-translations';
import {
  AnalyticsComponentType,
  ArbitraryComponentConfig,
  RecommendedEventsZeroState,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnalyticsDocLink } from '@modules/charts-generic';
import PopulatingEventsEmptyState from './components/PopulatingEventsEmptyState';
import CustomEventsNoEventsEmptyState from './components/CustomEventsNoEventsEmptyState';

export const arbitraryComponentConfigCustomEventsNoEvents = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <CustomEventsNoEventsEmptyState />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

const customEventsDocLink: AnalyticsDocLink = '/docs/production/analytics/custom-events';

export const arbitraryComponentConfigCustomEventsTrackEventUpsell = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return (
        <RecommendedEventsZeroState
          headingKey={translationKey(
            'Heading.CustomEventsZeroState',
            TranslationNamespace.Analytics,
          )}
          descriptionKey={translationKey(
            'Description.CustomEventsZeroStateOnboarding',
            TranslationNamespace.Analytics,
          )}
          primaryHref={customEventsDocLink}
          image={{
            src: `${process.env.assetPathPrefix}/analytics/custom_events_zero_state_full.webp`,
            lightModeSrc: `${process.env.assetPathPrefix}/analytics/custom_events_zero_state_full_light.webp`,
            altKey: translationKey('Heading.CustomEvents', TranslationNamespace.Analytics),
            absolute: false,
          }}
        />
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigCustomEventsPopulatingEventsEmptyState = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <PopulatingEventsEmptyState />;
    },
  },
} as const satisfies ArbitraryComponentConfig;
