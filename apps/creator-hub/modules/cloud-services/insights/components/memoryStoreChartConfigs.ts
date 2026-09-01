import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { AnalyticsControlledSubcontextConfig } from '@modules/experience-analytics-shared/components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import { RAQIV2ControlledSubcontextType } from '@modules/experience-analytics-shared/components/RAQIV2/subcontext/RAQIV2ControlledSubcontextConfig';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type { TabbedChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2TabbedChartConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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
