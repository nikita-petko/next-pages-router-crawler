import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  DateRangeType,
  AnalyticsDocLink,
  analyticsRecommendedEventsFunnelsNavigationItem,
} from '@modules/charts-generic';

import { translationKey } from '@modules/analytics-translations';

import {
  CreatorAnalyticsBreakdownTabPageConfig,
  RAQIV2SpecialLayoutType,
  TimeRangeType,
  CreatorAnalyticsPageMode,
  tabbedTableConfigFunnelProgressionBySessionAndUserRealtime,
  EndDateBehavior,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
} from '@modules/experience-analytics-shared';
import {
  RAQIV2MetricGranularity,
  RAQIV2Dimension,
  RAQIV2FunnelName,
} from '@rbx/creator-hub-analytics-config';
import {
  arbitraryComponentConfigFunnelLatestDataPointDisclaimer,
  arbitraryComponentConfigRecommendedEventsFunnelsZeroState,
  configuredExperimentsNUXBanner,
} from './funnelPageComponentsConfig';
import recommendedEventsFunnelsFilterDimensions from './recommendedEventsFunnelsFilterDimensions';
import { arbitraryComponentConfigRecommendedEventsLiveEventsButton } from '../Economy/economyPageComponentsConfig';
import {
  summaryCardConfigBiggestFunnelStepUserDropRealtime,
  summaryCardConfigTotalFunnelSessionsRealtime,
  summaryCardConfigTotalFunnelUsersRealtime,
  summaryCardConfigTotalUserConversionRealtime,
} from './funnelPageSummaryCardConfigs';

const recommendedEventsFunnelsDocLink: AnalyticsDocLink =
  '/docs/production/analytics/funnel-events';

const funnelPageConfig: CreatorAnalyticsBreakdownTabPageConfig<
  RAQIV2Dimension.FunnelName,
  RAQIV2FunnelName
> = {
  mode: CreatorAnalyticsPageMode.BreakdownTab,
  debugPageName: 'RecommendedEventsFunnels',
  docLinks: [recommendedEventsFunnelsDocLink],
  title: translationKey('Heading.Funnels', TranslationNamespace.Analytics),
  navigationItem: analyticsRecommendedEventsFunnelsNavigationItem,
  description: {
    standard: translationKey('Description.TakeActionFunnels', TranslationNamespace.Analytics),
  },
  tabBreakdownDimension: RAQIV2Dimension.FunnelName,
  tabBreakdownDateRange: {
    type: TimeRangeType.Relative,
    lookbackSeconds: 60 * 60 * 24 * 90, // 90 days
    granularity: RAQIV2MetricGranularity.None,
  },
  filteredTabDefinition: {
    getTabContextSpecOverride: (value: RAQIV2FunnelName) => ({
      filter: {
        intersect: [{ dimension: RAQIV2Dimension.FunnelName, values: [value] }],
      },
    }),
    config: {
      resourceTypes: [RAQIV2ChartResourceType.Universe],
      filterDimensions: recommendedEventsFunnelsFilterDimensions,
      breakdownDimensions: [],
      granularity: { fixed: RAQIV2MetricGranularity.None },
      body: [
        arbitraryComponentConfigFunnelLatestDataPointDisclaimer,
        {
          type: RAQIV2SpecialLayoutType.RowLayout,
          items: [
            summaryCardConfigTotalFunnelUsersRealtime,
            summaryCardConfigTotalFunnelSessionsRealtime,
            summaryCardConfigTotalUserConversionRealtime,
            summaryCardConfigBiggestFunnelStepUserDropRealtime,
          ],
        },
        {
          type: RAQIV2SpecialLayoutType.FullWidthLayout,
          items: [tabbedTableConfigFunnelProgressionBySessionAndUserRealtime],
        },
      ],
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
        supportedAnnotationTypes: [AnnotationType.Announcement],
        defaultAnnotationTypes: [],
        showAnnotationsControl: true,
      } as const satisfies AnalyticsPageConfigAnnotationOptions,
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
        items: [arbitraryComponentConfigRecommendedEventsFunnelsZeroState],
      },
    ],
    preControlCharts: [
      configuredExperimentsNUXBanner,
      arbitraryComponentConfigRecommendedEventsLiveEventsButton,
    ],
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
      supportedAnnotationTypes: [AnnotationType.Announcement],
      defaultAnnotationTypes: [],
      showAnnotationsControl: false,
    } as const satisfies AnalyticsPageConfigAnnotationOptions,
    hideHeroDivider: true,
  },
  preTabCharts: [
    configuredExperimentsNUXBanner,
    arbitraryComponentConfigRecommendedEventsLiveEventsButton,
  ],
};

export default funnelPageConfig;
