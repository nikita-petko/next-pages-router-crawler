import {
  RAQIV2Metric,
  RAQIV2Dimension,
  RAQIV2RewardedVideoEventType,
} from '@rbx/creator-hub-analytics-config';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { ChartOverlay } from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import {
  baseSplineChartConfig,
  baseSplineChartConfigWithAverageSummary,
  baseSplineChartConfigWithTotalAndAverageSummary,
} from './baseConfigs';
import configConstants from './configConstants';

// Earnings overview section: full-width earnings chart.
const rewardedVideoEarningsChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.EarningsTitleKey,
  definitionTooltipKey: configConstants.TotalRewardedVideoEarningsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DRevenueRobux,
} as const satisfies ChartConfig;

// Impressions breakdown section: full-width impressions chart.
const rewardedVideoTotalImpressionsChartConfig = {
  ...baseSplineChartConfigWithTotalAndAverageSummary,
  titleKey: configConstants.ImpressionsTitleKey,
  definitionTooltipKey: configConstants.ImpressionsDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DImpressions,
} as const satisfies ChartConfig;

// Impressions breakdown section: Opt-in rate chart — single-series spline on
// the aggregate ReachRatio metric (DUV / eDAU). Matches the metric used by the
// Opt-in rate summary card above and gives us annotations, y-axis labels, and
// explore-mode/custom-dashboard support that the multi-metric spline doesn't.
const rewardedVideoOptInRateChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  titleKey: configConstants.OptInRateTitleKey,
  definitionTooltipKey: configConstants.OptInRateDescriptionKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DReachRatio,
} as const satisfies ChartConfig;

// Impressions breakdown section: Frequency (Ads per DUV) chart with benchmark
// overlay to match the benchmark line shown in the mock. Tooltip text matches
// the legacy "Ads Per DUV" copy, so we reuse that translation key.
const rewardedVideoFrequencyChartConfig = {
  ...baseSplineChartConfigWithAverageSummary,
  titleKey: configConstants.FrequencyTitleKey,
  definitionTooltipKey: configConstants.ImpressionsPerDailyUniqueViewersTooltipKey,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DAdsPerDUV,
  overlays: [ChartOverlay.benchmark()],
} as const satisfies ChartConfig;

// EPM breakdown section: rewarded video funnel chart.
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

export default {
  rewardedVideoEarningsChartConfig,
  rewardedVideoTotalImpressionsChartConfig,
  rewardedVideoOptInRateChartConfig,
  rewardedVideoFrequencyChartConfig,
  rewardedVideoFunnelChartConfig,
};
