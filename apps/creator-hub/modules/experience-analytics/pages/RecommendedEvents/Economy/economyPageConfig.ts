import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type { RAQIV2CurrencyType } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsRecommendedEventsEconomyNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { tableConfigInGameEconomyTransactionsMigration } from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedTableConfigLiterals';
import RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import RAQIV2PredefinedTabbedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTabbedChartKey';
import { DateRangeSelectionType } from '@modules/experience-analytics-shared/types/DateRangeSelection';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type {
  AnalyticsPageConfigAnnotationOptions,
  CreatorAnalyticsBreakdownTabPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  recommendedEventsIntervalGranularityOptions,
  recommendedEventsTimeRangeOptions,
} from '../recommendedEventsAnalyticsControlOptions';
import {
  arbitraryComponentConfigRecommendedEventsEconomyZeroState,
  arbitraryComponentConfigRecommendedEventsLiveEventsButton,
} from './economyPageComponentsConfig';
import recommendedEventsEconomyFilterDimensions from './recommendedEventsEconomyFilterDimensions';

const recommendedEventsEconomyDocLink: AnalyticsDocLink =
  '/docs/production/analytics/economy-events';

const economyPageConfig: CreatorAnalyticsBreakdownTabPageConfig<
  RAQIV2Dimension.CurrencyType,
  RAQIV2CurrencyType
> = {
  mode: CreatorAnalyticsPageMode.BreakdownTab,
  debugPageName: 'RecommendedEventsEconomy',
  title: translationKey('Heading.Economy', TranslationNamespace.Analytics),
  navigationItem: analyticsRecommendedEventsEconomyNavigationItem,
  description: {
    standard: translationKey('Description.TakeActionEconomy', TranslationNamespace.Analytics),
  },
  docLinks: [recommendedEventsEconomyDocLink],
  tabBreakdownDimension: RAQIV2Dimension.CurrencyType,
  tabBreakdownDateRange: {
    type: DateRangeSelectionType.Preset,
    rangeType: RAQIV2DateRangeType.Last90Days,
    granularity: RAQIV2MetricGranularity.None,
  },
  filteredTabDefinition: {
    getTabContextSpecOverride: (value: RAQIV2CurrencyType) => ({
      filter: {
        intersect: [{ dimension: RAQIV2Dimension.CurrencyType, values: [value] }],
      },
    }),
    config: {
      resourceTypes: [RAQIV2ChartResourceType.Universe],
      filterDimensions: recommendedEventsEconomyFilterDimensions,
      breakdownDimensions: [],
      timeRangeOptions: recommendedEventsTimeRangeOptions,
      surfaceAnnotationOptions: {
        supportedAnnotationTypes: [
          AnnotationType.PlaceIcon,
          AnnotationType.PlaceThumbnail,
          AnnotationType.PlaceVideo,
          AnnotationType.PlaceVersion,
          AnnotationType.LiveEvent,
          AnnotationType.ConfigVersion,
          AnnotationType.Announcement,
        ],
        defaultAnnotationTypes: [],
        showAnnotationsControl: true,
      } as const satisfies AnalyticsPageConfigAnnotationOptions,
      granularity: recommendedEventsIntervalGranularityOptions,
      body: [
        RAQIV2PredefinedChartKey.TotalSourceAndSinkMigration,
        RAQIV2PredefinedChartKey.AverageWalletBalanceMigration,
        RAQIV2PredefinedTabbedChartKey.TopSourcesAndSinksMigration,
        tableConfigInGameEconomyTransactionsMigration,
      ],
      endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
    },
  },
  noTabEmptyState: {
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    filterDimensions: [],
    breakdownDimensions: [],
    body: [
      {
        type: RAQIV2SpecialLayoutType.FullWidthLayout,
        items: [arbitraryComponentConfigRecommendedEventsEconomyZeroState],
      },
    ],
    preControlCharts: [arbitraryComponentConfigRecommendedEventsLiveEventsButton],
    timeRangeOptions: recommendedEventsTimeRangeOptions,
    surfaceAnnotationOptions: {
      supportedAnnotationTypes: [
        AnnotationType.PlaceIcon,
        AnnotationType.PlaceThumbnail,
        AnnotationType.PlaceVideo,
        AnnotationType.PlaceVersion,
        AnnotationType.LiveEvent,
        AnnotationType.ConfigVersion,
        AnnotationType.Announcement,
      ],
      defaultAnnotationTypes: [],
      showAnnotationsControl: false,
    } as const satisfies AnalyticsPageConfigAnnotationOptions,
    hideHeroDivider: true,
    granularity: recommendedEventsIntervalGranularityOptions,
  },
  preTabCharts: [arbitraryComponentConfigRecommendedEventsLiveEventsButton],
};

export default economyPageConfig;
