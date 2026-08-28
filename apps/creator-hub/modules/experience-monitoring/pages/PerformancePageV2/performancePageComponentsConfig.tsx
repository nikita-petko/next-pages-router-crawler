import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import CCUSummary from '../../components/CCUSummary';
import SetupAlertBannerPreControl from '../../components/SetupAlertBannerPreControl';

export const arbitraryComponentConfigCCUSummary = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <CCUSummary />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigSetupAlertBanner = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <SetupAlertBannerPreControl />;
    },
  },
} as const satisfies ArbitraryComponentConfig;
