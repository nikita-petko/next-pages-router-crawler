import React from 'react';
import { translationKey } from '@modules/analytics-translations';
import {
  AnalyticsComponentType,
  RecommendedEventsZeroState,
  ArbitraryComponentConfig,
  GenericAnalyticsDataLastUpdatedOnDisclaimer,
  ExperimentsNUXBanner,
  RAQIV2SpecialLayoutType,
  RAQIV2PreControlComponent,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AnalyticsDocLink } from '@modules/charts-generic';

import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';

const recommendedEventsFunnelsDocLink: AnalyticsDocLink =
  '/docs/production/analytics/funnel-events';

export const arbitraryComponentConfigRecommendedEventsFunnelsZeroState = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return (
        <RecommendedEventsZeroState
          headingKey={translationKey('Heading.FunnelsZeroState', TranslationNamespace.Analytics)}
          descriptionKey={translationKey(
            'Description.FunnelsZeroStateOnboarding',
            TranslationNamespace.Analytics,
          )}
          primaryHref={recommendedEventsFunnelsDocLink}
          image={{
            src: `${process.env.assetPathPrefix}/analytics/funnels_zero_state_full.webp`,
            altKey: translationKey('Heading.Funnels', TranslationNamespace.Analytics),
            absolute: false,
          }}
        />
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigFunnelLatestDataPointDisclaimer = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [RAQIV2Metric.FunnelSessionsRealtime],
  renderer: {
    type: 'isolated',
    render: () => {
      return (
        <GenericAnalyticsDataLastUpdatedOnDisclaimer metric={RAQIV2Metric.FunnelSessionsRealtime} />
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const configuredExperimentsNUXBanner = {
  type: RAQIV2SpecialLayoutType.FullWidthLayout,
  items: [
    {
      type: AnalyticsComponentType.NonGeneric,
      metrics: [],
      renderer: {
        type: 'isolated',
        render: () => {
          return (
            <ExperimentsNUXBanner
              titleKey={translationKey(
                'Title.ExperimentsNUXBanner.Funnels',
                TranslationNamespace.Analytics,
              )}
              descriptionKey={translationKey(
                'Description.ExperimentsNUXBanner.Funnels',
                TranslationNamespace.Analytics,
              )}
              checkForInGameExperiment
            />
          );
        },
      },
    },
  ],
  stylingOverride: {
    style: {
      marginBottom: 16,
    },
  },
} as const satisfies RAQIV2PreControlComponent;
