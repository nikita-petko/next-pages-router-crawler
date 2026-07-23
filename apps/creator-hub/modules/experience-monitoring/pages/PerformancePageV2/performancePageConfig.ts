import { TranslationNamespace } from '@modules/miscellaneous/localization';

import {
  analyticsPerformanceNavigationItem,
  DateRangeType,
  AnalyticsDocLink,
  ChartType,
} from '@modules/charts-generic';

import { translationKey } from '@modules/analytics-translations';

import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsFixedTabPageConfig,
  RAQIV2EligibilityChecker,
  CreatorAnalyticsPageMode,
  chartConfigPerformancePeakConcurrentPlayers,
  chartConfigPerformanceSessionTime,
  chartConfigPerformanceClientCrashRate,
  chartConfigPerformanceClientMemoryUsage,
  chartConfigPerformanceClientMemoryUsagePercentage,
  chartConfigPerformanceServerCpuUsageV2,
  chartConfigPerformanceServerCpuEfficiency,
  controlledSubcontextConfigPerformanceCpuTimeCategory,
  controlledSubcontextConfigPerformanceServerMemoryUsageCategory,
  controlledSubcontextConfigPerformanceServerMemoryUsageByAgeCategory,
  controlledSubcontextConfigPerformanceClientFpsByPercentile,
  controlledSubcontextConfigPerformanceServerFpsByPercentile,
  chartConfigPerformanceClientOomUnexpectedExits,
  controlledSubcontextConfigPerformanceClientCpuTimeCategory,
  ChartConfig,
  TabbedChartConfig,
  AnalyticsComponentType,
  EndDateBehavior,
} from '@modules/experience-analytics-shared';
import { AnnotationType, RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2UIPseudoDimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import Category from '../../types/Category';

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
const orderedTabKeys = [Category.Client, Category.Server] as const;
type TPerformanceTabKeys = (typeof orderedTabKeys)[number];

const getPerformancePageConfig = (
  isClientScriptCPUTimeEnabled: boolean,
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
    tabOrder: orderedTabKeys,
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
            DateRangeType.Last1Hour,
            DateRangeType.Last1Day,
            DateRangeType.Last7Days,
            DateRangeType.Last28Days,
            DateRangeType.Custom,
          ],
          defaultRange: DateRangeType.Last1Day,
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
          ],
          defaultAnnotationTypes: [
            AnnotationType.PlaceVersion,
            AnnotationType.EngineRelease,
            AnnotationType.ClientCrashRateNotStableAlert,
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
          controlledSubcontextConfigPerformanceCpuTimeCategory,
          controlledSubcontextConfigPerformanceServerFpsByPercentile,
          controlledSubcontextConfigPerformanceServerMemoryUsageCategory,
          controlledSubcontextConfigPerformanceServerMemoryUsageByAgeCategory,
          chartConfigPerformanceServerCpuUsageV2,
          chartConfigPerformanceServerCpuEfficiency,
        ],
        filterDimensions: [RAQIV2Dimension.Place, RAQIV2UIPseudoDimension.PercentileType],
        breakdownDimensions: [],
        timeRangeOptions: {
          type: 'dateRange',
          supportedRanges: [
            DateRangeType.Last1Hour,
            DateRangeType.Last1Day,
            DateRangeType.Last7Days,
            DateRangeType.Last28Days,
            DateRangeType.Custom,
          ],
          defaultRange: DateRangeType.Last1Day,
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
          ],
          defaultAnnotationTypes: [
            AnnotationType.PlaceVersion,
            AnnotationType.EngineRelease,
            AnnotationType.ClientCrashRateNotStableAlert,
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
    },
  };
};
export default getPerformancePageConfig;
