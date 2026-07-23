import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
// oxlint-disable-next-line import/no-named-as-default
import RAQIV2SummaryType from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const chartConfigCubeTotalRequests = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.CubeTotalRequests', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CubeTotalRequests',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CubeTotalRequests,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.WorkflowType],
    },
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  chartType: ChartType.Bar,
  sort: {
    byBreakdownTotal: true,
  },
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigCubeDailyRequests = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.CubeDailyRequests', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CubeDailyRequests',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CubeDailyRequests,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.WorkflowType],
    },
  },
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: true,
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigCubeLatencyAvg = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.CubeLatencyAvg', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CubeLatencyAvg',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CubeLatencyAvg,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.WorkflowType],
    },
  },
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: true,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigCubeLatencyP99 = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.CubeLatencyP99', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CubeLatencyP99',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.CubeLatencyP99,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.WorkflowType],
    },
  },
  chartType: ChartType.Spline,
  hideTotalSeriesInChart: true,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigCubeOutcomes = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Label.Metric.CubeOutcomes', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.CubeOutcomes', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.CubeOutcomes,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.WorkflowType, RAQIV2Dimension.Outcome],
    },
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  chartType: ChartType.Pie,
  labelDataAsPercent: true,
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [{ type: ChartSummaryType.TopBreakdown }],
  },
} as const satisfies ChartConfig;
