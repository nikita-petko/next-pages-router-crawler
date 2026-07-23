import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import {
  DateRangeType,
  AnalyticsDocLink,
  analyticsRecommendedEventsEconomyNavigationItem,
} from '@modules/charts-generic';

import { translationKey } from '@modules/analytics-translations';

import {
  RAQIV2PredefinedChartKey,
  CreatorAnalyticsBreakdownTabPageConfig,
  RAQIV2PredefinedTabbedChartKey,
  RAQIV2SpecialLayoutType,
  TimeRangeType,
  CreatorAnalyticsPageMode,
  GranularityConstraint,
  tableConfigInGameEconomyTransactionsMigration,
  EndDateBehavior,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
} from '@modules/experience-analytics-shared';
import {
  RAQIV2MetricGranularity,
  RAQIV2CurrencyType,
  RAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import recommendedEventsEconomyFilterDimensions from './recommendedEventsEconomyFilterDimensions';
import {
  arbitraryComponentConfigRecommendedEventsEconomyZeroState,
  arbitraryComponentConfigRecommendedEventsLiveEventsButton,
} from './economyPageComponentsConfig';

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
    type: TimeRangeType.Relative,
    lookbackSeconds: 60 * 60 * 24 * 90, // 90 days
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
      timeRangeOptions: {
        type: 'dateRange',
        supportedRanges: [
          DateRangeType.Last1Day,
          DateRangeType.Last7Days,
          DateRangeType.Last28Days,
          DateRangeType.Last56Days,
          DateRangeType.Last90Days,
          DateRangeType.Last365Days,
          DateRangeType.Custom,
        ],
        defaultRange: DateRangeType.Last28Days,
        excludeEndDateInRange: false,
        maxEndDateOffset: 0,
        maxStartDateOffsetDays: 365 * 2,
        maxRangeDays: 365 * 2 + 1,
      } as const satisfies AnalyticsPageConfigDateOptions,
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
      granularity: {
        options: [
          RAQIV2MetricGranularity.OneHour,
          RAQIV2MetricGranularity.OneDay,
          RAQIV2MetricGranularity.OneWeek,
          RAQIV2MetricGranularity.OneMonth,
        ],
        constraints: {
          [RAQIV2MetricGranularity.OneHour]: GranularityConstraint.MOST_RECENT_SEVEN_DAYS,
        },
      },
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
    timeRangeOptions: {
      type: 'dateRange',
      supportedRanges: [
        DateRangeType.Last1Day,
        DateRangeType.Last7Days,
        DateRangeType.Last28Days,
        DateRangeType.Last56Days,
        DateRangeType.Last90Days,
        DateRangeType.Last365Days,
        DateRangeType.Custom,
      ],
      defaultRange: DateRangeType.Last28Days,
      excludeEndDateInRange: false,
      maxEndDateOffset: 0,
      maxStartDateOffsetDays: 365 * 2,
      maxRangeDays: 365 * 2 + 1,
    } as const satisfies AnalyticsPageConfigDateOptions,
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
  },
  preTabCharts: [arbitraryComponentConfigRecommendedEventsLiveEventsButton],
};

export default economyPageConfig;
