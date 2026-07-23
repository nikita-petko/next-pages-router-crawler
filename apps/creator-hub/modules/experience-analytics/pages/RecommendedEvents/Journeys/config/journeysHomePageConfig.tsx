import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { analyticsRecommendedEventsJourneyNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import type { CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import JourneysCreateAction from '../components/JourneysCreateAction';
import JourneysHomeBody from '../components/JourneysHomeBody';
import journeysBasePageConfig from './journeysBasePageConfig';

const arbitraryComponentConfigJourneysHomeBody = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => <JourneysHomeBody />,
  },
} as const satisfies ArbitraryComponentConfig;

const journeysHomePageConfig: CreatorAnalyticsUntabbedPageConfig = {
  ...journeysBasePageConfig,
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'RecommendedEventsJourneysHome',
  navigationItem: analyticsRecommendedEventsJourneyNavigationItem,
  action: <JourneysCreateAction />,
  timeRangeOptions: { type: 'None' },
  filterDimensions: [],
  body: [
    {
      type: RAQIV2SpecialLayoutType.FullWidthLayout,
      items: [arbitraryComponentConfigJourneysHomeBody],
    },
  ],
};

export default journeysHomePageConfig;
