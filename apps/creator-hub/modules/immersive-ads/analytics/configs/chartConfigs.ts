import { RAQIV2AdFormat, RAQIV2Dimension, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import RAQIV2SummaryType from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import {
  baseSplineChartConfig,
  baseSplineChartConfigWithAverageSummary,
  baseSplineChartConfigWithTotalAndAverageSummary,
  basePieChartConfigWithTotalBreakdownSummary,
} from './baseConfigs';
import configConstants from './configConstants';

/*
--------------------------------
START: Overview Charts
--------------------------------
*/

const totalRevenueRobuxChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.TotalRobuxEarningsTitleKey,
  definitionTooltipKey: configConstants.TotalRobuxEarningsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingTotalRevenueRobux,
} as const satisfies ChartConfig;

const totalImpressionsChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.TotalImpressionsTitleKey,
  definitionTooltipKey: configConstants.TotalImpressionsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingTotalImpressions,
} as const satisfies ChartConfig;

const totalRevenueRobuxPieChartConfig = {
  ...basePieChartConfigWithTotalBreakdownSummary,
  titleKey: configConstants.TotalRobuxEarningsTitleKey,
  definitionTooltipKey: configConstants.TotalRobuxEarningsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingTotalRevenueRobux,
} as const satisfies ChartConfig;

const totalImpressionsPieChartConfig = {
  ...basePieChartConfigWithTotalBreakdownSummary,
  titleKey: configConstants.TotalImpressionsTitleKey,
  definitionTooltipKey: configConstants.TotalImpressionsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingTotalImpressions,
} as const satisfies ChartConfig;

/*
--------------------------------
END: Overview Charts
--------------------------------
*/

/*
--------------------------------
START: Immersive Display Charts
--------------------------------
*/

const immersiveDisplayImpressionsChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.ImpressionsTitleKey,
  definitionTooltipKey: configConstants.ImmersiveDisplayImpressionsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingDisplayAdImpressions,
} as const satisfies ChartConfig;

const immersiveDisplayEarningsChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.EarningsTitleKey,
  definitionTooltipKey: configConstants.ImmersiveDisplayEarningsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingImmersiveDisplayRevenue,
} as const satisfies ChartConfig;

const immersiveDisplayEPMChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  titleKey: configConstants.EPMTitleKey,
  definitionTooltipKey: configConstants.ImmersiveDisplayEPMDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingImmersiveDisplayRobuxEpm,
} as const satisfies ChartConfig;

/*
--------------------------------
END: Immersive Display Charts
--------------------------------
*/

/*
--------------------------------
START: Immersive Video Charts
--------------------------------
*/

const immersiveVideoViewsChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.ImmersiveVideoViewsTitleKey,
  definitionTooltipKey: configConstants.ImmersiveVideoViewsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingImmersiveVideoViews,
  overrides: {},
} as const satisfies ChartConfig;

const immersiveVideoEarningsChartConfig = {
  ...baseSplineChartConfig,
  titleKey: configConstants.EarningsTitleKey,
  definitionTooltipKey: configConstants.ImmersiveVideoEarningsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingTotalRevenueRobux,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.AdFormat,
          values: [RAQIV2AdFormat.ImmersiveVideo],
        },
      ],
    },
  },
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

/*
--------------------------------
END: Immersive Video Charts
--------------------------------
*/

/*
--------------------------------
START: Teleports Summary Charts
--------------------------------
*/

const totalTeleportsSummaryChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.TotalTeleportsTitleKey,
  definitionTooltipKey: configConstants.TotalTeleportsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingTotalTeleports,
  overrides: {},
} as const satisfies ChartConfig;

const portalEarningsChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.EarningsTitleKey,
  definitionTooltipKey: configConstants.PortalEarningsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingPortalRevenueRobux,
} as const satisfies ChartConfig;

const portalsEarningsPerTeleportChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  titleKey: configConstants.PortalsEarningsPerTeleportTitleKey,
  definitionTooltipKey: configConstants.PortalsEarningsPerTeleportDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingRobuxEpt,
} as const satisfies ChartConfig;

/*
--------------------------------
END: Teleports Summary Charts
--------------------------------
*/

export default {
  totalRevenueRobuxChartConfig,
  totalImpressionsChartConfig,
  totalTeleportsSummaryChartConfig,
  immersiveVideoViewsChartConfig,
  portalEarningsChartConfig,
  immersiveVideoEarningsChartConfig,
  immersiveDisplayEarningsChartConfig,
  immersiveDisplayImpressionsChartConfig,
  immersiveDisplayEPMChartConfig,
  portalsEarningsPerTeleportChartConfig,
  totalRevenueRobuxPieChartConfig,
  totalImpressionsPieChartConfig,
};
