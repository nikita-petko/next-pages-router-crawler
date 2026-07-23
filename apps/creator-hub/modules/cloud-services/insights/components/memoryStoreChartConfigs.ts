import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import {
  AnalyticsComponentType,
  ChartConfig,
  RAQIV2SummaryType,
  AnalyticsControlledSubcontextConfig,
  RAQIV2ControlledSubcontextType,
  TabbedChartConfig,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

export const chartConfigMemoryStoreMemoryUsageBytes = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.MemoryUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.MemoryUsage',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.MemoryStoreMemoryUsageBytes,
  overrides: {},
  chartType: ChartType.Spline,
  quotaMetric: RAQIV2Metric.MemoryStoreMemoryQuotaBytes,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigMemoryStoreRequestUnits = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.ApiRequestUnits', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.ApiRequestUnits',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.MemoryStoreRequestUnits,
  overrides: {},
  chartType: ChartType.Spline,
  quotaMetric: RAQIV2Metric.MemoryStoreRequestUnitsQuota,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigMemoryStoreRequestUnitsByEndpoint = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.ApiRequestUnits', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.ApiRequestUnits',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.MemoryStoreRequestUnitsByEndpoint,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.MemoryStoreOperation],
    },
  },
  chartType: ChartType.Spline,
  quotaMetric: RAQIV2Metric.MemoryStoreRequestUnitsQuota,
  overlays: [],
  hideTotalSeriesInChart: true,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const tabbedChartConfigMemoryStoreRequestUnitsByEndpoint = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: 'MemoryStoreRequestUnitsByEndpoint',
  titleKey: translationKey('Title.ApiRequestUnits', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.ApiRequestUnits',
    TranslationNamespace.CloudServices,
  ),
  tabs: [
    {
      chart: chartConfigMemoryStoreRequestUnits,
      tabLabel: translationKey('Title.QuotaUsage', TranslationNamespace.CloudServices),
    },
    {
      chart: chartConfigMemoryStoreRequestUnitsByEndpoint,
      tabLabel: translationKey('Title.Breakdown', TranslationNamespace.CloudServices),
    },
  ],
} as const satisfies TabbedChartConfig;

export const chartConfigMemoryStoreRequestsByEndpoint = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.RequestCountByApi', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RequestCountByApi',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.MemoryStoreRequestsByEndpoint,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.MemoryStoreOperation],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
  hideTotalSeriesInChart: true,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigMemoryStoreRequestsByStatus = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.RequestCountByStatus', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RequestCountByStatus',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.MemoryStoreRequestsByStatus,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.MemoryStoreStatus],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
  hideTotalSeriesInChart: true,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigMemoryStoreRequestsByApiStatus = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.RequestsByApiStatus', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RequestsByApiStatus',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.MemoryStoreRequests,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.MemoryStoreOperation, RAQIV2Dimension.MemoryStoreStatus],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
  hideTotalSeriesInChart: true,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const controlledSubcontextConfigMemoryStoreRequestsByApiStatus = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
  body: chartConfigMemoryStoreRequestsByApiStatus,
  controlConfigs: [
    {
      filterDimension: RAQIV2Dimension.MemoryStoreOperation,
      breakdownDimensions: [],
      unfilteredEntry: {
        text: translationKey('Label.All', TranslationNamespace.Analytics),
        breakdownDimensions: [RAQIV2Dimension.MemoryStoreOperation],
      },
    },
    {
      filterDimension: RAQIV2Dimension.MemoryStoreStatus,
      breakdownDimensions: [],
      unfilteredEntry: {
        text: translationKey('Label.All', TranslationNamespace.Analytics),
        breakdownDimensions: [RAQIV2Dimension.MemoryStoreStatus],
      },
      defaultFilterDimensionValue: 'Success',
    },
  ],
} as const satisfies AnalyticsControlledSubcontextConfig;
