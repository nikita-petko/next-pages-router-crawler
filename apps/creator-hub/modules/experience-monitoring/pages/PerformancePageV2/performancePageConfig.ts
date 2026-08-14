import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { analyticsPerformanceNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import type { AnalyticsDocLink } from '@modules/charts-generic/types/AnalyticsDocLink';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  chartConfigPerformanceClientCrashRate,
  chartConfigPerformanceClientMemoryUsage,
  chartConfigPerformanceClientMemoryUsagePercentage,
  chartConfigPerformanceClientOomUnexpectedExits,
  chartConfigPerformancePeakConcurrentPlayers,
  chartConfigPerformanceServerCpuCoreUtilization,
  chartConfigPerformanceSessionTime,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedChartConfigLiterals';
import {
  controlledSubcontextConfigPerformanceClientCpuTimeCategory,
  controlledSubcontextConfigPerformanceClientFpsByPercentile,
  controlledSubcontextConfigPerformanceCpuTimeCategory,
  controlledSubcontextConfigPerformanceServerFpsByPercentile,
  controlledSubcontextConfigPerformanceServerMemoryUsageByAgeCategory,
  controlledSubcontextConfigPerformanceServerMemoryUsageCategory,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedSubcontextConfigLiterals';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import RAQIV2EligibilityChecker from '@modules/experience-analytics-shared/types/RAQIV2EligibilityChecker';
import {
  CreatorAnalyticsPageMode,
  EndDateBehavior,
  type AnalyticsPageConfigAnnotationOptions,
  type AnalyticsPageConfigDateOptions,
  type CreatorAnalyticsFixedTabPageConfig,
  type RAQIV2UIComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import type { TabbedChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2TabbedChartConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Category from '../../types/Category';
import { bandwidthNetworkTabBody } from './bandwidthChartConfigs';

const performanceDocLink: AnalyticsDocLink = '/docs/production/analytics/performance';

const chartConfigPerformanceClientCrashCount = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.ClientCrashCount', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.ClientCrashCount,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

const tabbedChartConfigPerformanceClientCrashRate = {
  type: AnalyticsComponentType.TabbedChart,
  titleKey: translationKey('Title.ClientCrashes', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ClientCrashRate',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigPerformanceClientCrashRate,
      tabLabel: translationKey('Title.CrashRate', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigPerformanceClientCrashCount,
      tabLabel: translationKey('Title.CrashCount', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;

// Default to client tab when orderedTabKeys[0] is client
const orderedTabKeys = [Category.Client, Category.Server, Category.Network] as const;
type TPerformanceTabKeys = (typeof orderedTabKeys)[number];

const getPerformancePageConfig = (
  isClientScriptCPUTimeEnabled: boolean,
  isExperienceAlertsEnabled: boolean,
  isNetworkTabEnabled: boolean,
  serverTabPrependedBody: RAQIV2UIComponent[] = [],
): CreatorAnalyticsFixedTabPageConfig<TPerformanceTabKeys> => {
  return {
    mode: CreatorAnalyticsPageMode.FixedTab,
    debugPageName: 'Performance',
    title: analyticsPerformanceNavigationItem.title,
    navigationItem: analyticsPerformanceNavigationItem,
    description: {
      standard: translationKey(
        'Description.TakeActionPerformance2',
        TranslationNamespace.Analytics,
      ),
      mobile: translationKey(
        'Description.TakeActionPerformanceMobile',
        TranslationNamespace.Analytics,
      ),
    },
    docLinks: [performanceDocLink],
    eligibility: {
      checkerType: RAQIV2EligibilityChecker.PerformanceMonitoring,
      ineligibleMessage: translationKey(
        'Message.PerformanceChartsNoPermission',
        TranslationNamespace.Analytics,
      ),
      ignorePreControlComponents: true,
    },
    // TODO(gperkins@20240507): DSA-2360 -- convert CCUSummary to be a special predefined component
    // preControlCharts: [RAQIV2PredefinedChartKey.CCUSummary],
    tabOrder: isNetworkTabEnabled ? orderedTabKeys : ([Category.Client, Category.Server] as const),
    tabs: {
      [Category.Client]: {
        tabKey: Category.Client,
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        label: translationKey('Label.Client', TranslationNamespace.Analytics),
        body: [
          chartConfigPerformancePeakConcurrentPlayers,
          chartConfigPerformanceSessionTime,
          tabbedChartConfigPerformanceClientCrashRate,
          chartConfigPerformanceClientOomUnexpectedExits,
          chartConfigPerformanceClientMemoryUsage,
          chartConfigPerformanceClientMemoryUsagePercentage,
          controlledSubcontextConfigPerformanceClientFpsByPercentile,
          ...(isClientScriptCPUTimeEnabled
            ? [controlledSubcontextConfigPerformanceClientCpuTimeCategory]
            : []),
        ],
        filterDimensions: [
          RAQIV2Dimension.Place,
          RAQIV2UIPseudoDimension.PercentileType,
          RAQIV2Dimension.Platform,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.MemoryGroup,
        ],
        breakdownDimensions: [
          RAQIV2Dimension.Platform,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.MemoryGroup,
          RAQIV2UIPseudoDimension.LatestPlaceVersion,
        ],
        defaultBreakdown: [RAQIV2Dimension.Platform],
        timeRangeOptions: {
          type: 'dateRange',
          supportedRanges: [
            RAQIV2DateRangeType.Last1Hour,
            RAQIV2DateRangeType.Last1Day,
            RAQIV2DateRangeType.Last7Days,
            RAQIV2DateRangeType.Last28Days,
            RAQIV2DateRangeType.Custom,
          ],
          defaultRange: RAQIV2DateRangeType.Last1Day,
          maxStartDateOffsetDays: 30,
        } as const satisfies AnalyticsPageConfigDateOptions,
        surfaceAnnotationOptions: {
          supportedAnnotationTypes: [
            AnnotationType.PlaceIcon,
            AnnotationType.PlaceThumbnail,
            AnnotationType.PlaceVideo,
            AnnotationType.PlaceVersion,
            AnnotationType.ConfigVersion,
            AnnotationType.EngineRelease,
            AnnotationType.Announcement,
            AnnotationType.ExtendedServicesEnablement,
            ...(isExperienceAlertsEnabled ? [AnnotationType.ConfiguredAlertIncident] : []),
          ],
          defaultAnnotationTypes: [
            AnnotationType.PlaceVersion,
            AnnotationType.EngineRelease,
            AnnotationType.ClientCrashRateNotStableAlert,
            AnnotationType.ExtendedServicesEnablement,
            ...(isExperienceAlertsEnabled ? [AnnotationType.ConfiguredAlertIncident] : []),
          ],
          showAnnotationsControl: true,
        } as const satisfies AnalyticsPageConfigAnnotationOptions,
        granularity: {
          options: [
            RAQIV2MetricGranularity.OneDay,
            RAQIV2MetricGranularity.OneHour,
            RAQIV2MetricGranularity.HalfHour,
            RAQIV2MetricGranularity.OneMinute,
          ],
        },
        endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
      },
      [Category.Server]: {
        tabKey: Category.Server,
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        label: translationKey('Label.Server', TranslationNamespace.Analytics),
        body: [
          ...serverTabPrependedBody,
          controlledSubcontextConfigPerformanceCpuTimeCategory,
          controlledSubcontextConfigPerformanceServerFpsByPercentile,
          {
            type: RAQIV2SpecialLayoutType.FullWidthLayout as const,
            items: [chartConfigPerformanceServerCpuCoreUtilization],
          },
          controlledSubcontextConfigPerformanceServerMemoryUsageCategory,
          controlledSubcontextConfigPerformanceServerMemoryUsageByAgeCategory,
        ],
        filterDimensions: [RAQIV2Dimension.Place, RAQIV2UIPseudoDimension.PercentileType],
        breakdownDimensions: [],
        timeRangeOptions: {
          type: 'dateRange',
          supportedRanges: [
            RAQIV2DateRangeType.Last1Hour,
            RAQIV2DateRangeType.Last1Day,
            RAQIV2DateRangeType.Last7Days,
            RAQIV2DateRangeType.Last28Days,
            RAQIV2DateRangeType.Custom,
          ],
          defaultRange: RAQIV2DateRangeType.Last1Day,
          maxStartDateOffsetDays: 30,
        } as const satisfies AnalyticsPageConfigDateOptions,
        surfaceAnnotationOptions: {
          supportedAnnotationTypes: [
            AnnotationType.PlaceIcon,
            AnnotationType.PlaceThumbnail,
            AnnotationType.PlaceVideo,
            AnnotationType.PlaceVersion,
            AnnotationType.ConfigVersion,
            AnnotationType.EngineRelease,
            AnnotationType.Announcement,
            AnnotationType.ExtendedServicesEnablement,
          ],
          defaultAnnotationTypes: [
            AnnotationType.PlaceVersion,
            AnnotationType.EngineRelease,
            AnnotationType.ClientCrashRateNotStableAlert,
            AnnotationType.ExtendedServicesEnablement,
          ],
          showAnnotationsControl: true,
        } as const satisfies AnalyticsPageConfigAnnotationOptions,
        granularity: {
          options: [
            RAQIV2MetricGranularity.OneDay,
            RAQIV2MetricGranularity.OneHour,
            RAQIV2MetricGranularity.HalfHour,
            RAQIV2MetricGranularity.OneMinute,
          ],
        },
        endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
      },
      [Category.Network]: {
        tabKey: Category.Network,
        resourceTypes: [RAQIV2ChartResourceType.Universe],
        label: translationKey('Label.Network', TranslationNamespace.Analytics),
        body: [...bandwidthNetworkTabBody],
        // Instance type is pinned as the breakdown per chart; these are page-level filters.
        filterDimensions: [
          RAQIV2Dimension.Place,
          RAQIV2Dimension.PlaceVersion,
          RAQIV2Dimension.Platform,
          RAQIV2Dimension.OperatingSystem,
          RAQIV2Dimension.MemoryGroup,
        ],
        breakdownDimensions: [],
        timeRangeOptions: {
          type: 'dateRange',
          supportedRanges: [
            RAQIV2DateRangeType.Last1Day,
            RAQIV2DateRangeType.Last7Days,
            RAQIV2DateRangeType.Last28Days,
            RAQIV2DateRangeType.Custom,
          ],
          defaultRange: RAQIV2DateRangeType.Last1Day,
          maxStartDateOffsetDays: 30,
        } as const satisfies AnalyticsPageConfigDateOptions,
        surfaceAnnotationOptions: {
          supportedAnnotationTypes: [AnnotationType.PlaceVersion, AnnotationType.EngineRelease],
          defaultAnnotationTypes: [AnnotationType.PlaceVersion, AnnotationType.EngineRelease],
          showAnnotationsControl: true,
        } as const satisfies AnalyticsPageConfigAnnotationOptions,
        // Bandwidth data is hourly (no minute/half-hour granularity available).
        granularity: {
          options: [RAQIV2MetricGranularity.OneDay, RAQIV2MetricGranularity.OneHour],
        },
        endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
      },
    },
  };
};
export default getPerformancePageConfig;
