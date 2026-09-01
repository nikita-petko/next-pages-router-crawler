import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import RecommendedEventsZeroState from '@modules/experience-analytics-shared/components/RecommendedEventsZeroState/RecommendedEventsZeroState';
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
