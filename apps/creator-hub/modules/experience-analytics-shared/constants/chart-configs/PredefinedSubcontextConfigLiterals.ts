import {
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  RAQIV2PercentileType,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { DateRangeType } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import {
  AnalyticsControlledSubcontextConfig,
  RAQIV2ControlledSubcontextType,
  RAQIV2TimeRangeControlMode,
} from '../../components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import {
  chartConfigClientCPUTime,
  chartConfigPerformanceClientFps,
  chartConfigPerformanceServerCpuTimeV2,
  chartConfigPerformanceServerFpsV2,
  chartConfigPerformanceServerMemoryUsageByAge,
  chartConfigPerformanceServerMemoryUsageV2,
  chartConfigThumbnailImpressions,
  chartConfigThumbnailL7QualifiedPTR,
  chartConfigThumbnailQualifiedPTR,
} from './PredefinedChartConfigLiterals';
import { getTabbedChartConfigExperienceAnalyticsSummaryV3 } from './PredefinedTabbedChartConfigLiterals';

export const controlledSubcontextConfigPerformanceCpuTimeCategory = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
  body: chartConfigPerformanceServerCpuTimeV2,
  controlConfigs: [
    {
      filterDimension: RAQIV2Dimension.CpuTimeCategory,
      breakdownDimensions: [RAQIV2Dimension.CpuTimeSubCategory],
      unfilteredEntry: {
        text: translationKey('Label.Total', TranslationNamespace.Analytics),
        breakdownDimensions: [RAQIV2Dimension.CpuTimeCategory],
      },
    },
  ],
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigPerformanceServerMemoryUsageCategory = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
  body: chartConfigPerformanceServerMemoryUsageV2,
  controlConfigs: [
    {
      filterDimension: RAQIV2Dimension.MemoryUsageCategory,
      breakdownDimensions: [RAQIV2Dimension.MemoryUsageSubCategory],
      unfilteredEntry: {
        text: translationKey('Label.Total', TranslationNamespace.Analytics),
        breakdownDimensions: [RAQIV2Dimension.MemoryUsageCategory],
      },
    },
  ],
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigPerformanceClientCpuTimeCategory = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
  body: chartConfigClientCPUTime,
  controlConfigs: [
    {
      filterDimension: RAQIV2Dimension.ClientCpuTimeCategory,
      breakdownDimensions: [RAQIV2Dimension.ClientCpuTimeSubCategory],
      unfilteredEntry: {
        text: translationKey('Label.Total', TranslationNamespace.Analytics),
        breakdownDimensions: [RAQIV2Dimension.ClientCpuTimeCategory],
      },
    },
  ],
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigPerformanceServerMemoryUsageByAgeCategory = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
  body: chartConfigPerformanceServerMemoryUsageByAge,
  controlConfigs: [
    {
      filterDimension: RAQIV2Dimension.MemoryUsageCategory,
      breakdownDimensions: [RAQIV2Dimension.MemoryUsageSubCategory],
      unfilteredEntry: {
        text: translationKey('Label.Total', TranslationNamespace.Analytics),
        breakdownDimensions: [RAQIV2Dimension.MemoryUsageCategory],
      },
    },
  ],
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigThumbnailQualifiedPTRDateRange = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride,
  controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown,
  body: chartConfigThumbnailQualifiedPTR,
  dateRangeOptions: [DateRangeType.Last7Days, DateRangeType.Last1Day],
  defaultDateRangeType: DateRangeType.Last7Days,
  granularityByDateRangeOverride: {
    [DateRangeType.Last7Days]: RAQIV2MetricGranularity.OneHour,
    [DateRangeType.Last1Day]: RAQIV2MetricGranularity.OneHour,
  },
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigThumbnailL7QualifiedPTRDateRange = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride,
  controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown,
  body: chartConfigThumbnailL7QualifiedPTR,
  dateRangeOptions: [DateRangeType.Last7Days, DateRangeType.Last1Day],
  defaultDateRangeType: DateRangeType.Last7Days,
  granularityByDateRangeOverride: {
    [DateRangeType.Last7Days]: RAQIV2MetricGranularity.OneHour,
    [DateRangeType.Last1Day]: RAQIV2MetricGranularity.OneHour,
  },
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigThumbnailImpressionDateRange = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride,
  controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown,
  body: chartConfigThumbnailImpressions,
  dateRangeOptions: [DateRangeType.Last7Days, DateRangeType.Last1Day],
  defaultDateRangeType: DateRangeType.Last7Days,
  granularityByDateRangeOverride: {
    [DateRangeType.Last7Days]: RAQIV2MetricGranularity.OneHour,
    [DateRangeType.Last1Day]: RAQIV2MetricGranularity.OneHour,
  },
} as const satisfies AnalyticsControlledSubcontextConfig;

export const getControlledSubcontextConfigExperienceAnalyticsSnapshotV2 = (useL7Metrics = true) =>
  ({
    type: AnalyticsComponentType.ControlledSubcontext,
    subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride,
    controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown,
    body: getTabbedChartConfigExperienceAnalyticsSummaryV3(useL7Metrics),
    dateRangeOptions: [
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Custom,
    ],
    defaultDateRangeType: DateRangeType.Last7Days,
    granularityByDateRangeOverride: {
      [DateRangeType.Last7Days]: RAQIV2MetricGranularity.OneDay,
      [DateRangeType.Last28Days]: RAQIV2MetricGranularity.OneDay,
      [DateRangeType.Last56Days]: RAQIV2MetricGranularity.OneDay,
      [DateRangeType.Last90Days]: RAQIV2MetricGranularity.OneDay,
      [DateRangeType.Custom]: RAQIV2MetricGranularity.OneDay,
    },
  }) as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigPerformanceClientFpsByPercentile = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
  body: chartConfigPerformanceClientFps,
  controlConfigs: [
    {
      filterDimension: RAQIV2UIPseudoDimension.PercentileType,
      breakdownDimensions: [],
      defaultFilterDimensionValue: RAQIV2PercentileType.P10,
    },
  ],
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigPerformanceServerFpsByPercentile = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
  body: chartConfigPerformanceServerFpsV2,
  controlConfigs: [
    {
      filterDimension: RAQIV2UIPseudoDimension.PercentileType,
      breakdownDimensions: [],
      defaultFilterDimensionValue: RAQIV2PercentileType.P10,
    },
  ],
} as const satisfies AnalyticsControlledSubcontextConfig;
