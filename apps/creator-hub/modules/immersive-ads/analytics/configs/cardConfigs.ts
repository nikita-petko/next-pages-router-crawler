import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import { RAQIV2SummaryCardType } from '@modules/experience-analytics-shared/constants/RAQIV2SummaryCardType';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { noFilterOrBreakdownOverride } from './baseConfigs';
import configConstants from './configConstants';

// -----------------------------------------------------------------------------
// Legacy cards: rendered when `isRewardedVideoRedesignEnabled` is OFF. They
// match prod's current single-row layout. Once the redesign flag is fully
// rolled out, these (and their consumers in `rewardedVideoPageLayoutLegacy`)
// can be deleted.
// -----------------------------------------------------------------------------

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

// Legacy Fill Rate card. Same metric as `fillRateCardConfigV2` below, but
// without `showComparisonChip` so the legacy layout's behavior stays
// byte-for-byte the same when `isRewardedVideoRedesignEnabled` is OFF.
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

// -----------------------------------------------------------------------------
// V2 cards: rendered when `isRewardedVideoRedesignEnabled` is ON.
// -----------------------------------------------------------------------------

// Earnings overview: total impressions.
const totalImpressionsCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DImpressions,
  summaryType: { type: RAQIV2SummaryType.Total },
  label: {
    key: configConstants.ImpressionsTitleKey,
    tooltip: configConstants.ImpressionsDescriptionKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

// Earnings overview / EPM breakdown: average EPM.
// Uses `EPMShortTitleKey` (-> "EPM") to match the compact card label in the
// design rather than the longer "Earnings Per Mille (EPM)" title. Robux icon
// renders automatically because the underlying metric's unit is Robux.
const epmCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DEpmNoUnvalidatedPc,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.EPMShortTitleKey,
    tooltip: configConstants.RewardedVideoEPMDescriptionKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

// Earnings overview: total earnings (Robux). Robux icon renders
// automatically based on the metric's unit.
const totalEarningsCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DRevenueRobux,
  summaryType: { type: RAQIV2SummaryType.Total },
  label: {
    key: configConstants.EarningsTitleKey,
    tooltip: configConstants.TotalRewardedVideoEarningsDescriptionKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

// Impressions breakdown: average DUV.
const dailyUniqueViewersCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DDailyUniqueViewer,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.DailyUniqueViewersTitleKey,
    tooltip: configConstants.DailyUniqueViewersDescriptionKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

// Impressions breakdown: Frequency (Ads per DUV). Same metric as the legacy
// "Ads Per DUV" card, re-labeled per updated design. Tooltip text is identical
// to the legacy "Ads Per DUV" tooltip, so we reuse that translation key.
const frequencyCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DAdsPerDUV,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.FrequencyTitleKey,
    tooltip: configConstants.ImpressionsPerDailyUniqueViewersTooltipKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

// EPM breakdown: fill rate. V2 variant of the legacy `fillRateCardConfig`,
// opting into the inline comparison chip for the redesign layout. The legacy
// config is intentionally kept chip-free so the prod fallback layout doesn't
// change behavior when `isRewardedVideoRedesignEnabled` is OFF.
const fillRateCardConfigV2 = {
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
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

// Impressions breakdown: opt-in rate (% of ads-eligible users who see at least
// one ad). Backed by the dedicated ReachRatio metric (DUV / eDAU).
const optInRateCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DReachRatio,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.OptInRateTitleKey,
    tooltip: configConstants.OptInRateDescriptionKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

// EPM breakdown: show rate (% of ad requests that were successfully delivered
// and shown to users, i.e. impressions / fills).
const showRateCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DConversionRate,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.ShowRateTitleKey,
    tooltip: configConstants.ShowRateDescriptionKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

// EPM breakdown: reward rate (% of times a user watches an ad and gets a
// reward, i.e. rewards / impressions).
const rewardRateCardConfig = {
  type: AnalyticsComponentType.SummaryCard,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.AdsPublisherReportingVideo2DRewardPercent,
  summaryType: { type: RAQIV2SummaryType.Average },
  label: {
    key: configConstants.RewardRateTitleKey,
    tooltip: configConstants.RewardRateDescriptionKey,
    type: 'simple',
  },
  fullWidth: false,
  overrides: {},
  showComparisonChip: true,
} as const satisfies AnalyticsSummaryCardConfig;

export default {
  // V2 (redesign)
  totalImpressionsCardConfig,
  epmCardConfig,
  totalEarningsCardConfig,
  dailyUniqueViewersCardConfig,
  frequencyCardConfig,
  fillRateCardConfigV2,
  optInRateCardConfig,
  showRateCardConfig,
  rewardRateCardConfig,
  // Legacy
  impressionsPerEligibileDAUCardConfig,
  impressionsPerEligibileDAUBreakdownCardConfig,
  impressionsPerDailyUniqueViewersCardConfig,
  rewardedVideoConversionRateCardConfig,
  fillRateCardConfig,
};
