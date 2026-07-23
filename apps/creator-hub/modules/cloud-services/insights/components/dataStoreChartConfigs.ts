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

export const chartConfigDataStoreStorageUsageBytes = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreStorageUsageBytes,
  titleKey: translationKey('Title.DataStoreStorageUsageBytes', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreStorageUsageBytes',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreStorageUsageBytes,
  overrides: {
    filter: {
      override: [],
    },
  },
  chartType: ChartType.Spline,
  quotaMetric: RAQIV2Metric.DataStoreStorageQuotaBytes,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigDataStoreRequestsByEndpoint = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreRequestsByEndpoint,
  titleKey: translationKey('Title.RequestCountByApi', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RequestCountByApi',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreRequestsByEndpoint,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.DataStoreOperation],
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

export const chartConfigDataStoreRequestsByStatus = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreRequestsByStatus,
  titleKey: translationKey('Title.RequestCountByStatus', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RequestCountByStatus',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreRequestsByStatus,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.DataStoreStatus],
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

export const chartConfigDataStoreRequestsByEndpointStatus = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreRequestsByEndpointStatus,
  titleKey: translationKey('Title.RequestsByApiStatus', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RequestsByApiStatus',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreRequests,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.DataStoreOperation, RAQIV2Dimension.DataStoreStatus],
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

export const chartConfigDataStoreReadRequests = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreReadRequests,
  titleKey: translationKey('Title.DataStoreReadApiUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreReadApiUsage',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreReadRequests,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigDataStoreReadRequestsByEndpoint = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreReadRequestsByEndpoint,
  titleKey: translationKey('Title.ReadRequestsQuota', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.ReadRequestsQuota',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreReadRequestsByEndpoint,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.DataStoreOperation],
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

export const chartConfigDataStoreWriteRequests = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreWriteRequests,
  titleKey: translationKey('Title.DataStoreWriteApiUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreWriteApiUsage',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreWriteRequests,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigDataStoreWriteRequestsByEndpoint = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreWriteRequestsByEndpoint,
  titleKey: translationKey('Title.WriteRequestsQuota', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.WriteRequestsQuota',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreWriteRequestsByEndpoint,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.DataStoreOperation],
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

export const chartConfigDataStoreListRequests = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreListRequests,
  titleKey: translationKey('Title.DataStoreListApiUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreListApiUsage',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreListRequests,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigDataStoreListRequestsByEndpoint = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreListRequestsByEndpoint,
  titleKey: translationKey('Title.ListRequestsQuota', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.ListRequestsQuota',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreListRequestsByEndpoint,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.DataStoreOperation],
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

export const chartConfigDataStoreRemoveRequests = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreRemoveRequests,
  titleKey: translationKey('Title.DataStoreRemoveApiUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreRemoveApiUsage',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreRemoveRequests,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigDataStoreRemoveRequestsByEndpoint = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreListRequestsByEndpoint,
  titleKey: translationKey('Title.RemoveRequestsQuota', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RemoveRequestsQuota',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreRemoveRequestsByEndpoint,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.DataStoreOperation],
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

export const chartConfigDataStoreConsumedReadRequests = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreConsumedReadRequests,
  titleKey: translationKey(
    'Title.DataStoreConsumedReadRequests',
    TranslationNamespace.CloudServices,
  ),
  definitionTooltipKey: translationKey(
    'Description.DataStoreConsumedReadRequests',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreConsumedReadRequests,
  overrides: {},
  chartType: ChartType.Spline,
  hideComparisonChip: true,
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  quotaMetric: RAQIV2Metric.DataStoreReadRequestsQuotaStandard,
} as const satisfies ChartConfig;

export const chartConfigDataStoreConsumedWriteRequests = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreConsumedWriteRequests,
  titleKey: translationKey(
    'Title.DataStoreConsumedWriteRequests',
    TranslationNamespace.CloudServices,
  ),
  definitionTooltipKey: translationKey(
    'Description.DataStoreConsumedWriteRequests',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreConsumedWriteRequests,
  overrides: {},
  chartType: ChartType.Spline,
  hideComparisonChip: true,
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  quotaMetric: RAQIV2Metric.DataStoreWriteRequestsQuotaStandard,
} as const satisfies ChartConfig;

export const chartConfigDataStoreConsumedListRequests = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreConsumedListRequests,
  titleKey: translationKey(
    'Title.DataStoreConsumedListRequests',
    TranslationNamespace.CloudServices,
  ),
  definitionTooltipKey: translationKey(
    'Description.DataStoreConsumedListRequests',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreConsumedListRequests,
  overrides: {},
  chartType: ChartType.Spline,
  hideComparisonChip: true,
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  quotaMetric: RAQIV2Metric.DataStoreListRequestsQuotaStandard,
} as const satisfies ChartConfig;

export const chartConfigDataStoreConsumedRemoveRequests = {
  type: AnalyticsComponentType.Chart,
  // chartKey: RAQIV2PredefinedChartKey.DataStoreConsumedRemoveRequests,
  titleKey: translationKey(
    'Title.DataStoreConsumedRemoveRequests',
    TranslationNamespace.CloudServices,
  ),
  definitionTooltipKey: translationKey(
    'Description.DataStoreConsumedRemoveRequests',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.DataStoreConsumedRemoveRequests,
  overrides: {},
  chartType: ChartType.Spline,
  hideComparisonChip: true,
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
  quotaMetric: RAQIV2Metric.DataStoreRemoveRequestsQuotaStandard,
} as const satisfies ChartConfig;

export const tabbedChartConfigDataStoreReadRequests = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: 'DataStoreReadRequests',
  titleKey: translationKey('Title.DataStoreReadApiUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreReadApiUsage',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigDataStoreReadRequests,
      tabLabel: translationKey('Title.Total', TranslationNamespace.CloudServices),
    },
    {
      chart: chartConfigDataStoreReadRequestsByEndpoint,
      tabLabel: translationKey('Title.Breakdown', TranslationNamespace.CloudServices),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigDataStoreWriteRequests = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: 'DataStoreWriteRequests',
  titleKey: translationKey('Title.DataStoreWriteApiUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreWriteApiUsage',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigDataStoreWriteRequests,
      tabLabel: translationKey('Title.Total', TranslationNamespace.CloudServices),
    },
    {
      chart: chartConfigDataStoreWriteRequestsByEndpoint,
      tabLabel: translationKey('Title.Breakdown', TranslationNamespace.CloudServices),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigDataStoreListRequests = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: 'DataStoreListRequests',
  titleKey: translationKey('Title.DataStoreListApiUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreListApiUsage',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigDataStoreListRequests,
      tabLabel: translationKey('Title.Total', TranslationNamespace.CloudServices),
    },
    {
      chart: chartConfigDataStoreListRequestsByEndpoint,
      tabLabel: translationKey('Title.Breakdown', TranslationNamespace.CloudServices),
    },
  ],
} as const satisfies TabbedChartConfig;

export const tabbedChartConfigDataStoreRemoveRequests = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: 'DataStoreRemoveRequests',
  titleKey: translationKey('Title.DataStoreRemoveApiUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.DataStoreRemoveApiUsage',
    TranslationNamespace.Analytics,
  ),
  tabs: [
    {
      chart: chartConfigDataStoreRemoveRequests,
      tabLabel: translationKey('Title.Total', TranslationNamespace.CloudServices),
    },
    {
      chart: chartConfigDataStoreRemoveRequestsByEndpoint,
      tabLabel: translationKey('Title.Breakdown', TranslationNamespace.CloudServices),
    },
  ],
} as const satisfies TabbedChartConfig;

export const controlledSubcontextConfigDataStoreRequestsByEndpointStatus = {
  type: AnalyticsComponentType.ControlledSubcontext,
  subcontextType: RAQIV2ControlledSubcontextType.DimensionFilterAndBreakdownOverride,
  body: chartConfigDataStoreRequestsByEndpointStatus,
  controlConfigs: [
    {
      filterDimension: RAQIV2Dimension.DataStoreOperation,
      breakdownDimensions: [],
      unfilteredEntry: {
        text: translationKey('Label.All', TranslationNamespace.Analytics),
        breakdownDimensions: [RAQIV2Dimension.DataStoreOperation],
      },
    },
    {
      filterDimension: RAQIV2Dimension.DataStoreStatus,
      breakdownDimensions: [],
      unfilteredEntry: {
        text: translationKey('Label.All', TranslationNamespace.Analytics),
        breakdownDimensions: [RAQIV2Dimension.DataStoreStatus],
      },
      defaultFilterDimensionValue: 'Ok',
    },
  ],
} as const satisfies AnalyticsControlledSubcontextConfig;
