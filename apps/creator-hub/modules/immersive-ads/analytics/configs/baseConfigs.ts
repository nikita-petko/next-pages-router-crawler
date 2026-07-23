import { RAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import type { TAnalyticsMetricTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { TAnalyticsSerializableTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import RAQIV2SummaryType from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type { SpecOverride } from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';

export const baseSplineChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartType: ChartType.Spline,
  overlays: [],
  overrides: {},
} as const satisfies Partial<ChartConfig>;

export const basePieChartConfig = {
  type: AnalyticsComponentType.Chart,
  chartType: ChartType.Pie,
  overrides: {},
  labelDataAsPercent: true,
} as const satisfies Partial<ChartConfig>;

export const basePieChartConfigWithTotalBreakdownSummary = {
  ...basePieChartConfig,
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies Partial<ChartConfig>;

export const baseSplineChartConfigWithTotalAndAverageSummary = {
  ...baseSplineChartConfig,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies Partial<ChartConfig>;

export const baseSplineChartConfigWithTotalSummary = {
  ...baseSplineChartConfig,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies Partial<ChartConfig>;

export const baseSplineChartConfigWithAverageSummary = {
  ...baseSplineChartConfig,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies Partial<ChartConfig>;

export const baseTableConfig = {
  type: AnalyticsComponentType.Table,
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    firstDataRowIsSummary: true,
    hover: true,
  },
  isTotalRowIncluded: true,
} as const satisfies Partial<TAnalyticsSerializableTableConfig>;

export const baseAdInstanceNameDataColumnConfig = {
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AdInstanceName],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  isComparisonDataShown: true,
} as const satisfies Partial<TAnalyticsMetricTableColumnConfig>;

export const baseAdPlacementDataColumnConfig = {
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.AdPlacementId],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  isComparisonDataShown: true,
} as const satisfies Partial<TAnalyticsMetricTableColumnConfig>;

export const baseTableConfigForAdInstanceName = {
  ...baseTableConfig,
  breakdowns: [RAQIV2Dimension.AdInstanceName],
} as const satisfies Partial<TAnalyticsSerializableTableConfig>;

export const baseTableConfigForAdPlacement = {
  ...baseTableConfig,
  breakdowns: [RAQIV2Dimension.AdPlacementId],
} as const satisfies Partial<TAnalyticsSerializableTableConfig>;

export const noFilterOrBreakdownOverride = {
  filter: {
    override: [],
  },
  breakdown: {
    override: [],
  },
} as const satisfies Partial<SpecOverride>;

export default {
  baseSplineChartConfig,
  baseSplineChartConfigWithTotalAndAverageSummary,
  baseSplineChartConfigWithAverageSummary,
  baseTableConfig,
  baseTableConfigForAdInstanceName,
  baseTableConfigForAdPlacement,
  baseAdInstanceNameDataColumnConfig,
  noFilterOrBreakdownOverride,
  basePieChartConfigWithTotalBreakdownSummary,
};
