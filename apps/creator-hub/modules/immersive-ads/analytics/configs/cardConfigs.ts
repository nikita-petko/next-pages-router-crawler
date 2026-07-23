import {
  AnalyticsComponentType,
  RAQIV2SummaryCardType,
  RAQIV2SummaryType,
  AnalyticsSummaryCardConfig,
} from '@modules/experience-analytics-shared';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import configConstants from './configConstants';
import { noFilterOrBreakdownOverride } from './baseConfigs';

const impressionsPerEligibileDAUCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingAdsPerEDAU,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.AdsPerEDAUTitleKey,
    tooltip: configConstants.AdsPerEDAUTooltipKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: noFilterOrBreakdownOverride,
} as const satisfies AnalyticsSummaryCardConfig;

// Breakdown-enabled card config using AdsVideo2DEngagementBreakdown cube
const impressionsPerEligibileDAUBreakdownCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsVideo2DAdsPerEDAUBreakdown,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.AdsPerEDAUTitleKey,
    tooltip: configConstants.AdsPerEDAUTooltipKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
} as const satisfies AnalyticsSummaryCardConfig;

const impressionsPerDailyUniqueViewersCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DAdsPerDUV,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.ImpressionsPerDailyUniqueViewersTitleKey,
    tooltip: configConstants.ImpressionsPerDailyUniqueViewersTooltipKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
} as const satisfies AnalyticsSummaryCardConfig;

const fillRateCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DFillPercent,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.FillRateTitleKey,
    tooltip: configConstants.FillRateTooltipKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
} as const satisfies AnalyticsSummaryCardConfig;

const rewardedVideoConversionRateCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DConversionRate,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.ConversionTitleKey,
    tooltip: configConstants.RewardedVideoConversionTooltipKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
} as const satisfies AnalyticsSummaryCardConfig;

export default {
  impressionsPerEligibileDAUCardConfig,
  impressionsPerDailyUniqueViewersCardConfig,
  fillRateCardConfig,
  rewardedVideoConversionRateCardConfig,
  impressionsPerEligibileDAUBreakdownCardConfig,
};
