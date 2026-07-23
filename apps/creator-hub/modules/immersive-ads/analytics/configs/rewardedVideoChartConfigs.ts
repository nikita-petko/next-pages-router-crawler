import { ChartConfig, RAQIV2SummaryType } from '@modules/experience-analytics-shared';
import {
  RAQIV2Metric,
  RAQIV2Dimension,
  RAQIV2RewardedVideoEventType,
} from '@rbx/creator-hub-analytics-config';
import configConstants from './configConstants';
import {
  baseSplineChartConfig,
  baseSplineChartConfigWithAverageSummary,
  baseSplineChartConfigWithTotalAndAverageSummary,
  noFilterOrBreakdownOverride,
} from './baseConfigs';

const rewardedVideoRevenueRobuxChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.TotalRobuxEarningsTitleKey,
  definitionTooltipKey: configConstants.TotalRewardedVideoEarningsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DRevenueRobux,
} as const satisfies ChartConfig;

const rewardedVideoAverageEarningsPerDailyUniqueViewerChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  titleKey: configConstants.AverageEarningsPerDailyUniqueViewerTitleKey,
  definitionTooltipKey: configConstants.AverageEarningsPerDailyUniqueViewerDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DAverageEarningPerDailyUniqueViewer,
} as const satisfies ChartConfig;

const rewardedVideoFunnelChartConfig = {
  ...baseSplineChartConfig,
  titleKey: configConstants.RewardedVideoFunnelTitleKey,
  definitionTooltipKey: configConstants.RewardedVideoFunnelDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DEvents,
  hideTotalSeriesInChart: true,
  overrides: {
    filter: {
      intersect: [
        {
          dimension: RAQIV2Dimension.RewardedVideoEventType,
          values: [
            RAQIV2RewardedVideoEventType.Request,
            RAQIV2RewardedVideoEventType.Fill,
            RAQIV2RewardedVideoEventType.Impression,
            RAQIV2RewardedVideoEventType.Reward,
            RAQIV2RewardedVideoEventType.Opportunity,
          ],
        },
      ],
    },
    breakdown: {
      override: [RAQIV2Dimension.RewardedVideoEventType],
    },
  },
  summarySpec: {
    totalSummaryTypes: [],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

const rewardedVideoTotalImpressionsChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.ImpressionsTitleKey,
  definitionTooltipKey: configConstants.ImpressionsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DImpressions,
} as const satisfies ChartConfig;

const rewardedVideoDailyUniqueViewerChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  titleKey: configConstants.DailyUniqueViewersTitleKey,
  definitionTooltipKey: configConstants.DailyUniqueViewersDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DDailyUniqueViewer,
} as const satisfies ChartConfig;

const rewardedVideoEPMChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  titleKey: configConstants.EPMTitleKey,
  definitionTooltipKey: configConstants.RewardedVideoEPMDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DEpmNoUnvalidatedPc,
} as const satisfies ChartConfig;

const rewardedVideoEligibleDAUChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  overrides: noFilterOrBreakdownOverride,
  titleKey: configConstants.EligibleDAUTitleKey,
  definitionTooltipKey: configConstants.RewardedVideoEligibleDAUDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DEligibleDau,
} as const satisfies ChartConfig;

const rewardedVideoReachPercentageChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  overrides: noFilterOrBreakdownOverride,
  titleKey: configConstants.ReachPercentageTitleKey,
  definitionTooltipKey: configConstants.ReachPercentageDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DReachRatio,
} as const satisfies ChartConfig;

// Breakdown-enabled chart configs using AdsVideo2DEngagementBreakdown cube
// These support demographic breakdowns (country, age, gender, platform, OS)
const rewardedVideoEligibleDAUBreakdownChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  overrides: {},
  titleKey: configConstants.EligibleDAUTitleKey,
  definitionTooltipKey: configConstants.RewardedVideoEligibleDAUDescriptionKey,
  metric: RAQIV2Metric.AdsVideo2DEligibleDauBreakdown,
} as const satisfies ChartConfig;

const rewardedVideoReachPercentageBreakdownChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  overrides: {},
  titleKey: configConstants.ReachPercentageTitleKey,
  definitionTooltipKey: configConstants.ReachPercentageDescriptionKey,
  metric: RAQIV2Metric.AdsVideo2DReachRatioBreakdown,
} as const satisfies ChartConfig;

export default {
  rewardedVideoRevenueRobuxChartConfig,
  rewardedVideoAverageEarningsPerDailyUniqueViewerChartConfig,
  rewardedVideoFunnelChartConfig,
  rewardedVideoTotalImpressionsChartConfig,
  rewardedVideoDailyUniqueViewerChartConfig,
  rewardedVideoEPMChartConfig,
  rewardedVideoEligibleDAUChartConfig,
  rewardedVideoReachPercentageChartConfig,
  rewardedVideoEligibleDAUBreakdownChartConfig,
  rewardedVideoReachPercentageBreakdownChartConfig,
};
