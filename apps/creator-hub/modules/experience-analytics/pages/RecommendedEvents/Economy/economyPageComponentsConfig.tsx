import { translationKey } from '@modules/analytics-translations';
import { AnalyticsDocLink } from '@modules/charts-generic';
import {
  AnalyticsComponentType,
  RecommendedEventsZeroState,
  ArbitraryComponentConfig,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import LiveEventsButtonWithDialog from './components/LiveEventsButtonWithDialog';

const recommendedEventsEconomyDocLink: AnalyticsDocLink =
  '/docs/production/analytics/economy-events';

export const arbitraryComponentConfigRecommendedEventsEconomyZeroState = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return (
        <RecommendedEventsZeroState
          headingKey={translationKey(
            'Heading.InExperienceEconomyZeroState',
            TranslationNamespace.Analytics,
          )}
          descriptionKey={translationKey(
            'Description.InExperienceEconomyZeroStateOnboarding',
            TranslationNamespace.Analytics,
          )}
          primaryHref={recommendedEventsEconomyDocLink}
          image={{
            src: `${process.env.assetPathPrefix}/analytics/economy_zero_state_full.webp`,
            altKey: translationKey('Heading.Economy', TranslationNamespace.Analytics),
            absolute: true,
          }}
        />
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigRecommendedEventsLiveEventsButton = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <LiveEventsButtonWithDialog />;
    },
  },
} as const satisfies ArbitraryComponentConfig;
