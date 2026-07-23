import { RAQIV2Metric, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import {
  tabbedTableConfigJourneySessions,
  tabbedTableConfigJourneyUsers,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedTabbedTableConfigLiterals';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type { CreatorAnalyticsFixedTabPageConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { CreatorAnalyticsPageMode } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { journeysTimeRangeOptions } from '../../recommendedEventsAnalyticsControlOptions';
import JourneySankeyChart from '../components/JourneySankeyChart';
import type { JourneySankeyMetric } from '../types';
import { JOURNEY_SANKEY_METRIC_TABS } from '../types';
import journeysBasePageConfig from './journeysBasePageConfig';
import {
  summaryCardConfigBiggestDropNode,
  summaryCardConfigBiggestDropNodeSessions,
  summaryCardConfigBiggestDropStage,
  summaryCardConfigTotalFinalStageSessions,
  summaryCardConfigTotalFinalStageUsers,
  summaryCardConfigTotalJourneySessions,
  summaryCardConfigTotalJourneyUsers,
} from './journeysSummaryCardConfigs';
import recommendedEventsJourneysFilterDimensions from './recommendedEventsJourneysFilterDimensions';

const arbitraryComponentConfigJourneySankey = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [RAQIV2Metric.JourneyTransitionCountUser, RAQIV2Metric.JourneyTransitionCount],
  renderer: {
    type: 'withChartContext',
    render: (chartContext: RAQIV2ChartContext) => (
      <JourneySankeyChart chartContext={chartContext} />
    ),
  },
} as const satisfies ArbitraryComponentConfig;

const getJourneysPageConfig = (): CreatorAnalyticsFixedTabPageConfig<JourneySankeyMetric> => {
  const sharedTabConfig = {
    ...journeysBasePageConfig,
    timeRangeOptions: journeysTimeRangeOptions,
    filterDimensions: recommendedEventsJourneysFilterDimensions,
    granularity: { fixed: RAQIV2MetricGranularity.None },
    hideHeroDivider: true,
  } as const;

  return {
    ...journeysBasePageConfig,
    mode: CreatorAnalyticsPageMode.FixedTab,
    debugPageName: 'RecommendedEventsJourney',
    tabOrder: JOURNEY_SANKEY_METRIC_TABS,
    tabs: {
      sessions: {
        ...sharedTabConfig,
        tabKey: 'sessions',
        label: translationKey('Label.JourneyMetricSessions', TranslationNamespace.Analytics),
        body: [
          {
            type: RAQIV2SpecialLayoutType.RowLayout,
            items: [
              summaryCardConfigTotalJourneySessions,
              summaryCardConfigTotalFinalStageSessions,
              summaryCardConfigBiggestDropNodeSessions,
              summaryCardConfigBiggestDropStage,
            ],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [arbitraryComponentConfigJourneySankey],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [tabbedTableConfigJourneySessions],
          },
        ],
      },
      users: {
        ...sharedTabConfig,
        tabKey: 'users',
        label: translationKey('Label.JourneyMetricUsers', TranslationNamespace.Analytics),
        body: [
          {
            type: RAQIV2SpecialLayoutType.RowLayout,
            items: [
              summaryCardConfigTotalJourneyUsers,
              summaryCardConfigTotalFinalStageUsers,
              summaryCardConfigBiggestDropNode,
              summaryCardConfigBiggestDropStage,
            ],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [arbitraryComponentConfigJourneySankey],
          },
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout,
            items: [tabbedTableConfigJourneyUsers],
          },
        ],
      },
    },
  };
};

export default getJourneysPageConfig;
