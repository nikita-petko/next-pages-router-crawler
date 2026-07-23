import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import type { RAQIV2FunnelName } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsRecommendedEventsFunnelsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import type { AnalyticsControlledSubcontextConfig } from '@modules/experience-analytics-shared/components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import {
  RAQIV2ControlledSubcontextType,
  RAQIV2DefaultFilterDimensionValueMode,
} from '@modules/experience-analytics-shared/components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import { tabbedTableConfigFunnelProgressionBySessionAndUserRealtime } from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedTabbedTableConfigLiterals';
import {
  tableConfigFunnelsProgressionBySessionRealtime,
  tableConfigFunnelsProgressionByUserRealtime,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedTableConfigLiterals';
import RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import { DateRangeSelectionType } from '@modules/experience-analytics-shared/types/DateRangeSelection';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsBreakdownTabPageConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { arbitraryComponentConfigRecommendedEventsLiveEventsButton } from '../Economy/economyPageComponentsConfig';
import {
  arbitraryComponentConfigFunnelLatestDataPointDisclaimer,
  arbitraryComponentConfigRecommendedEventsFunnelsZeroState,
  configuredExperimentsNUXBanner,
  FunnelProgressionViewKey,
  funnelProgressionViewSelectorConfig,
} from './funnelPageComponentsConfig';
import {
  summaryCardConfigBiggestFunnelStepSessionDrop,
  summaryCardConfigBiggestFunnelStepUserDrop,
  summaryCardConfigTotalFunnelSessions,
  summaryCardConfigTotalFunnelUsers,
  summaryCardConfigTotalSessionConversion,
  summaryCardConfigTotalUserConversion,
} from './funnelPageSummaryCardConfigs';
import recommendedEventsFunnelsFilterDimensions from './recommendedEventsFunnelsFilterDimensions';

const recommendedEventsFunnelsDocLink: AnalyticsDocLink =
  '/docs/production/analytics/funnel-events';

const getFunnelProgressionTableConfig = (viewKey: string) => {
  return viewKey === FunnelProgressionViewKey.Session
    ? tableConfigFunnelsProgressionBySessionRealtime
    : tableConfigFunnelsProgressionByUserRealtime;
};

const getFunnelProgressionSummaryCards = (viewKey: string) => {
  return viewKey === FunnelProgressionViewKey.Session
    ? [
        summaryCardConfigTotalFunnelSessions,
        summaryCardConfigTotalSessionConversion,
        summaryCardConfigBiggestFunnelStepSessionDrop,
      ]
    : [
        summaryCardConfigTotalFunnelUsers,
        summaryCardConfigTotalUserConversion,
        summaryCardConfigBiggestFunnelStepUserDrop,
      ];
};

const getFunnelCohortCompletionRateChartKey = (viewKey: string) => {
  return viewKey === FunnelProgressionViewKey.Session
    ? RAQIV2PredefinedChartKey.FunnelCohortSessionCompletionRate
    : RAQIV2PredefinedChartKey.FunnelCohortCompletionRate;
};

// User and Session charts share the same funnel steps, so preserve valid
// step selections when switching between views of the same funnel.
const funnelCohortStepSelectionStateKey = 'funnel-cohort-step-selection';

const getControlledSubcontextConfigFunnelCohortCompletionRateByStep = (viewKey: string) =>
  ({
    type: AnalyticsComponentType.ControlledSubcontext,
    subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
    body: getFunnelCohortCompletionRateChartKey(viewKey),
    selectionStateKey: funnelCohortStepSelectionStateKey,
    controlConfigs: [
      {
        filterDimension: RAQIV2Dimension.FunnelStep,
        breakdownDimensions: [RAQIV2Dimension.FunnelStep],
        multiple: true,
        maxSelectedOptions: 11,
        defaultFilterDimensionValueMode: RAQIV2DefaultFilterDimensionValueMode.LastOption,
        pinDefaultFilterDimensionValue: true,
        filterSummaryToDefaultFilterDimensionValue: true,
        truncateValue: true,
        unfilteredEntry: {
          text: translationKey('Label.Total', TranslationNamespace.Analytics),
          breakdownDimensions: [RAQIV2Dimension.FunnelStep],
        },
      },
    ],
  }) as const satisfies AnalyticsControlledSubcontextConfig;

const getFunnelPageConfig = (
  isFunnelCohortCompletionRateEnabled: boolean,
): CreatorAnalyticsBreakdownTabPageConfig<RAQIV2Dimension.FunnelName, RAQIV2FunnelName> => ({
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
    type: DateRangeSelectionType.Preset,
    rangeType: RAQIV2DateRangeType.Last90Days,
    granularity: RAQIV2MetricGranularity.OneDay,
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
      granularity: { fixed: RAQIV2MetricGranularity.OneDay },
      body: isFunnelCohortCompletionRateEnabled
        ? [
            arbitraryComponentConfigFunnelLatestDataPointDisclaimer,
            {
              type: RAQIV2SpecialLayoutType.RowLayout,
              items: getFunnelProgressionSummaryCards(FunnelProgressionViewKey.User),
            },
            {
              type: RAQIV2SpecialLayoutType.FullWidthLayout,
              items: [
                getFunnelProgressionTableConfig(FunnelProgressionViewKey.User),
                getControlledSubcontextConfigFunnelCohortCompletionRateByStep(
                  FunnelProgressionViewKey.User,
                ),
              ],
            },
          ]
        : [
            arbitraryComponentConfigFunnelLatestDataPointDisclaimer,
            {
              type: RAQIV2SpecialLayoutType.RowLayout,
              items: [
                summaryCardConfigTotalFunnelUsers,
                summaryCardConfigTotalFunnelSessions,
                summaryCardConfigTotalUserConversion,
                summaryCardConfigBiggestFunnelStepUserDrop,
              ],
            },
            {
              type: RAQIV2SpecialLayoutType.FullWidthLayout,
              items: [tabbedTableConfigFunnelProgressionBySessionAndUserRealtime],
            },
          ],
      ...(isFunnelCohortCompletionRateEnabled
        ? {
            surfaceViewSelector: {
              ...funnelProgressionViewSelectorConfig,
              getBodyForView: (viewKey: string) => [
                arbitraryComponentConfigFunnelLatestDataPointDisclaimer,
                {
                  type: RAQIV2SpecialLayoutType.RowLayout,
                  items: getFunnelProgressionSummaryCards(viewKey),
                },
                {
                  type: RAQIV2SpecialLayoutType.FullWidthLayout,
                  items: [
                    getFunnelProgressionTableConfig(viewKey),
                    getControlledSubcontextConfigFunnelCohortCompletionRateByStep(viewKey),
                  ],
                },
              ],
            },
          }
        : {}),
      timeRangeOptions: {
        type: 'dateRange',
        supportedRanges: [
          RAQIV2DateRangeType.Last1Day,
          RAQIV2DateRangeType.Last7Days,
          RAQIV2DateRangeType.Last28Days,
          RAQIV2DateRangeType.Last56Days,
          RAQIV2DateRangeType.Last90Days,
          RAQIV2DateRangeType.Last365Days,
          RAQIV2DateRangeType.Custom,
        ],
        defaultRange: RAQIV2DateRangeType.Last28Days,
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
        RAQIV2DateRangeType.Last1Day,
        RAQIV2DateRangeType.Last7Days,
        RAQIV2DateRangeType.Last28Days,
        RAQIV2DateRangeType.Last56Days,
        RAQIV2DateRangeType.Last90Days,
        RAQIV2DateRangeType.Last365Days,
        RAQIV2DateRangeType.Custom,
      ],
      defaultRange: RAQIV2DateRangeType.Last28Days,
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
  preTabCharts: [
    configuredExperimentsNUXBanner,
    arbitraryComponentConfigRecommendedEventsLiveEventsButton,
  ],
});

export default getFunnelPageConfig;
