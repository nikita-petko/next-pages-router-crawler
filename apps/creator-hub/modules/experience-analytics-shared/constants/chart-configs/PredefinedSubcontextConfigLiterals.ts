import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { AnalyticsControlledSubcontextConfig } from '../../components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import {
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
  dateRangeOptions: [RAQIV2DateRangeType.Last7Days, RAQIV2DateRangeType.Last1Day],
  defaultDateRangeType: RAQIV2DateRangeType.Last7Days,
  granularityByDateRangeOverride: {
    [RAQIV2DateRangeType.Last7Days]: RAQIV2MetricGranularity.OneHour,
    [RAQIV2DateRangeType.Last1Day]: RAQIV2MetricGranularity.OneHour,
  },
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigThumbnailL7QualifiedPTRDateRange = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride,
  controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown,
  body: chartConfigThumbnailL7QualifiedPTR,
  dateRangeOptions: [RAQIV2DateRangeType.Last7Days, RAQIV2DateRangeType.Last1Day],
  defaultDateRangeType: RAQIV2DateRangeType.Last7Days,
  granularityByDateRangeOverride: {
    [RAQIV2DateRangeType.Last7Days]: RAQIV2MetricGranularity.OneHour,
    [RAQIV2DateRangeType.Last1Day]: RAQIV2MetricGranularity.OneHour,
  },
} as const satisfies AnalyticsControlledSubcontextConfig;

export const controlledSubcontextConfigThumbnailImpressionDateRange = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride,
  controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown,
  body: chartConfigThumbnailImpressions,
  dateRangeOptions: [RAQIV2DateRangeType.Last7Days, RAQIV2DateRangeType.Last1Day],
  defaultDateRangeType: RAQIV2DateRangeType.Last7Days,
  granularityByDateRangeOverride: {
    [RAQIV2DateRangeType.Last7Days]: RAQIV2MetricGranularity.OneHour,
    [RAQIV2DateRangeType.Last1Day]: RAQIV2MetricGranularity.OneHour,
  },
} as const satisfies AnalyticsControlledSubcontextConfig;

export const getControlledSubcontextConfigExperienceAnalyticsSnapshotV2 = (useL7Metrics = true) =>
  ({
    type: AnalyticsComponentType.ControlledSubcontext,
    subcontextType: RAQIV2ControlledSubcontextType.TimeRangeOverride,
    controlMode: RAQIV2TimeRangeControlMode.DateRangeDropdown,
    body: getTabbedChartConfigExperienceAnalyticsSummaryV3(useL7Metrics),
    dateRangeOptions: [
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultDateRangeType: RAQIV2DateRangeType.Last7Days,
    granularityByDateRangeOverride: {
      [RAQIV2DateRangeType.Last7Days]: RAQIV2MetricGranularity.OneDay,
      [RAQIV2DateRangeType.Last28Days]: RAQIV2MetricGranularity.OneDay,
      [RAQIV2DateRangeType.Last56Days]: RAQIV2MetricGranularity.OneDay,
      [RAQIV2DateRangeType.Last90Days]: RAQIV2MetricGranularity.OneDay,
      [RAQIV2DateRangeType.Custom]: RAQIV2MetricGranularity.OneDay,
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
