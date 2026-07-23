import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { mapNonEmptyArray, type NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import { isValidEnumValue, isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { ChartDisplayContext, QuotaConfig } from '../types/RAQIV2ChartConfig';
import {
  type ChartConfigDisplayOptions,
  type ChartConfig,
  isMultiMetricChartConfig,
} from '../types/RAQIV2ChartConfig';
import type RAQIV2ChartContext from '../types/RAQIV2ChartContext';
import type { ChartOverlays } from '../types/RAQIV2ChartSpec';
import type { SpecOverride } from '../utils/computeRAQIV2SpecOverride';
import { getQuotaConfigForMetric } from '../utils/getQuotaConfigForMetric';
import {
  getUniqueKeyForKeyOrConfig,
  type UniqueKeyForAnalyticsComponent,
} from '../utils/getUniqueKeyForKeyOrConfig';
import isMetricFanoutDimension from '../utils/isMetricFanoutDimension';
import getAnalyticsMetricDisplayConfig, {
  type TRAQIV2NumericUIMetric,
} from './AnalyticsMetricDisplayConfig';
import {
  chartConfigTotalSourceAndSinkMigration,
  chartConfigTopSourcesMigration,
  chartConfigTopSinksMigration,
  chartConfigAverageWalletBalanceMigration,
  chartConfigAcquisitionNewUsersWithPlays,
  chartConfigAcquisitionNewUsersWithImpressions,
  chartConfigAcquisitionReturningUsersWithPlays,
  chartConfigAcquisitionReturningUsersWithImpressions,
  chartConfigAcquisitionHomeRecommendationQualifiedPTR,
  chartConfigAcquisitionHomeRecommendationQualifiedPTRMigration,
  chartConfigD1Retention,
  chartConfigD7Retention,
  chartConfigD30Retention,
  chartConfigDailyActiveUsers,
  chartConfigMonthlyActiveUsers,
  chartConfigEngagementNewUsers,
  chartConfigEngagementReturningUsers,
  chartConfigEngagementNewUsersSessionTime,
  chartConfigEngagementReturningUsersSessionTime,
  chartConfigEngagementTotalPlayTime,
  chartConfigEngagementSessions,
  chartConfigEngagementAverageSessionTime,
  chartConfigEngagementAveragePlayTimePerDAU,
  chartConfigEngagementNewUserSessionTimeRetention,
  chartConfigDailyRevenue,
  chartConfigPayingUsers,
  chartConfigDailyRevenueBySource,
  chartConfigAverageRevenuePerDailyActiveUser,
  chartConfigAverageRevenuePerPayingUser,
  chartConfigConversionRate,
  chartConfigAcquisitionNewUsersWithPlaysV2,
  chartConfigAcquisitionNewUsersWithImpressionsV2,
  chartConfigAcquisitionReturningUsersWithPlaysV2,
  chartConfigAcquisitionReturningUsersWithImpressionsV2,
  chartConfigAcquisitionNewUsersWithPlaysV2Migration,
  chartConfigAcquisitionNewUsersWithImpressionsV2Migration,
  chartConfigAcquisitionReturningUsersWithPlaysV2Migration,
  chartConfigAcquisitionReturningUsersWithImpressionsV2Migration,
  chartConfigTopSourcesByNewUsersWithPlays,
  chartConfigTopSourcesByNewUsersWithPlaysMigration,
  chartConfigTopSourcesBy30DRevenuePerUser,
  chartConfigTopSourcesBy30DRevenuePerUserMigration,
  chartConfigPerformanceClientFps,
  chartConfigPerformanceClientMemoryUsage,
  chartConfigPerformanceClientMemoryUsagePercentage,
  chartConfigPerformanceClientCrashRate,
  chartConfigPerformanceSessionTime,
  chartConfigPerformancePeakConcurrentPlayers,
  chartConfigPerformanceServerFps,
  chartConfigPerformanceServerFpsV2,
  chartConfigPerformanceServerCpuEfficiency,
  chartConfigPerformanceServerMemoryUsage,
  chartConfigPerformanceServerCpuUsage,
  chartConfigPerformanceServerCpuUsageV2,
  chartConfigOverviewMiniConcurrentPlayers,
  chartConfigPerformanceServerCpuTimeV2,
  chartConfigPerformanceServerMemoryUsageV2,
  chartConfigPerformanceServerMemoryUsageByAge,
  chartConfigCustomEventsMigration,
  chartConfigFunnelCohortCompletionRate,
  chartConfigFunnelCohortSessionCompletionRate,
  chartConfigThumbnailQualifiedPTR,
  chartConfigThumbnailL7QualifiedPTR,
  chartConfigThumbnailImpressions,
  chartConfigHomeRecommendationImpressions,
  chartConfigHomeRecommendationPlays,
  chartConfigRFYPlayThroughRate,
  chartConfigRFYL7PlayDays,
  chartConfigRFYL7PlayTime,
  chartConfigRFYL7RobuxSpent,
  chartConfigRFYL7RobuxSpentDays,
  chartConfigRFYL7IntentionalCoplayDays,
  chartConfigRFYDeepEngagementRate,
  chartConfigRFYQualifiedPTR,
  chartConfigPlayerFeedbackVotesCountByVoteType,
  chartConfigQualifiedPTRAndImpressionComparison,
  chartConfigDauMauStickiness,
  chartConfigForwardD1Retention,
  chartConfigForwardD7Retention,
  chartConfigForwardD30Retention,
  chartConfigCommerceCheckouts,
  chartConfigCommerceClicks,
  chartConfigCommerceGMV,
  chartConfigCommerceImpressions,
  chartConfigCommerceOrders,
  chartConfigCommerceQuantitySold,
  chartConfigCommerceUniqueCheckouts,
  chartConfigCommerceUniqueClicks,
  chartConfigCommerceUniqueImpressions,
  chartConfigCommerceUniqueOrders,
  chartConfigSponsoredAdPlays,
} from './chart-configs/PredefinedChartConfigLiterals';
import RAQIV2PredefinedChartKey from './RAQIV2PredefinedChartKey';

export type {
  BarChartDisplayOptions,
  PieChartDisplayOptions,
  ChartConfigDisplayOptions,
  DurationSplineChartDisplayOptions,
  SplineChartDisplayOptions,
  TGenericRAQIV2Sort,
  BarChartConfig,
  MapAndBarChartConfig,
  ColumnChartConfig,
  SplineChartConfig,
  AreaChartConfig,
  DurationSplineChartConfig,
  DurationAreaChartConfig,
  PieChartConfig,
  MultipleMetricSplineChartConfig,
  ChartConfig,
} from '../types/RAQIV2ChartConfig';

type MetricConfig = {
  metric: TRAQIV2NumericUIMetric;
  overrides: SpecOverride;
};

/**
 * Excluded chart keys here are defined in their respective modules
 */
const decentralizedChartKeys = [
  // Audience Page -- @modules/experience-analytics/pages/AudiencePageRAQI
  RAQIV2PredefinedChartKey.AudienceCountry,
  RAQIV2PredefinedChartKey.AudienceGender,
  RAQIV2PredefinedChartKey.AudienceAge,
  RAQIV2PredefinedChartKey.AudienceLanguage,

  // Creator Store -- @modules/analytics-home-page/StoreTab
  RAQIV2PredefinedChartKey.StoreAssetSales,
  RAQIV2PredefinedChartKey.StoreAssetRevenue,

  // UGC Item Analytics -- @modules/creations/itemAnalytics
  RAQIV2PredefinedChartKey.ItemPurchaserAge,
  RAQIV2PredefinedChartKey.ItemPurchaserDemographics,
  RAQIV2PredefinedChartKey.ItemPurchaserGender,
  RAQIV2PredefinedChartKey.ItemPurchasePlatform,
  RAQIV2PredefinedChartKey.ItemMarketplaceVersusInExperience,
  RAQIV2PredefinedChartKey.ItemRevenue,
  RAQIV2PredefinedChartKey.ItemSales,

  // Monetization Page -- @modules/experience-analytics/pages/MonetizationPage
  RAQIV2PredefinedChartKey.DailyRevenueByBalanceType,
] as const satisfies RAQIV2PredefinedChartKey[];

export type TRAQIV2PredefinedChartKey = Exclude<
  RAQIV2PredefinedChartKey,
  (typeof decentralizedChartKeys)[number]
>;

export const isCentralizedPredefinedChartKey = (key: string): key is TRAQIV2PredefinedChartKey => {
  return (
    isValidEnumValue(RAQIV2PredefinedChartKey, key) &&
    !isValidArrayEnumValue(decentralizedChartKeys, key)
  );
};

const RAQIV2PredefinedChartConfig: Record<TRAQIV2PredefinedChartKey, ChartConfig> = {
  [RAQIV2PredefinedChartKey.TotalSourceAndSinkMigration]: chartConfigTotalSourceAndSinkMigration,
  [RAQIV2PredefinedChartKey.TopSourcesMigration]: chartConfigTopSourcesMigration,
  [RAQIV2PredefinedChartKey.TopSinksMigration]: chartConfigTopSinksMigration,
  [RAQIV2PredefinedChartKey.AverageWalletBalanceMigration]:
    chartConfigAverageWalletBalanceMigration,
  [RAQIV2PredefinedChartKey.AcquisitionNewUsersWithPlays]: chartConfigAcquisitionNewUsersWithPlays,
  [RAQIV2PredefinedChartKey.AcquisitionNewUsersWithImpressions]:
    chartConfigAcquisitionNewUsersWithImpressions,
  [RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithPlays]:
    chartConfigAcquisitionReturningUsersWithPlays,
  [RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithImpressions]:
    chartConfigAcquisitionReturningUsersWithImpressions,
  [RAQIV2PredefinedChartKey.AcquisitionHomeRecommendationQualifiedPTR]:
    chartConfigAcquisitionHomeRecommendationQualifiedPTR,
  [RAQIV2PredefinedChartKey.AcquisitionHomeRecommendationQualifiedPTRMigration]:
    chartConfigAcquisitionHomeRecommendationQualifiedPTRMigration,
  [RAQIV2PredefinedChartKey.D1Retention]: chartConfigD1Retention,
  [RAQIV2PredefinedChartKey.ForwardD1Retention]: chartConfigForwardD1Retention,
  [RAQIV2PredefinedChartKey.D7Retention]: chartConfigD7Retention,
  [RAQIV2PredefinedChartKey.ForwardD7Retention]: chartConfigForwardD7Retention,
  [RAQIV2PredefinedChartKey.D30Retention]: chartConfigD30Retention,
  [RAQIV2PredefinedChartKey.ForwardD30Retention]: chartConfigForwardD30Retention,
  [RAQIV2PredefinedChartKey.DailyActiveUsers]: chartConfigDailyActiveUsers,
  [RAQIV2PredefinedChartKey.MonthlyActiveUsers]: chartConfigMonthlyActiveUsers,
  [RAQIV2PredefinedChartKey.EngagementNewUsers]: chartConfigEngagementNewUsers,
  [RAQIV2PredefinedChartKey.EngagementReturningUsers]: chartConfigEngagementReturningUsers,
  [RAQIV2PredefinedChartKey.EngagementNewUsersSessionTime]:
    chartConfigEngagementNewUsersSessionTime,
  [RAQIV2PredefinedChartKey.EngagementReturningUsersSessionTime]:
    chartConfigEngagementReturningUsersSessionTime,
  [RAQIV2PredefinedChartKey.EngagementTotalPlayTime]: chartConfigEngagementTotalPlayTime,
  [RAQIV2PredefinedChartKey.EngagementSessions]: chartConfigEngagementSessions,
  [RAQIV2PredefinedChartKey.EngagementAverageSessionTime]: chartConfigEngagementAverageSessionTime,
  [RAQIV2PredefinedChartKey.EngagementAveragePlayTimePerDAU]:
    chartConfigEngagementAveragePlayTimePerDAU,
  [RAQIV2PredefinedChartKey.EngagementNewUserSessionTimeRetention]:
    chartConfigEngagementNewUserSessionTimeRetention,
  [RAQIV2PredefinedChartKey.DailyRevenue]: chartConfigDailyRevenue,
  [RAQIV2PredefinedChartKey.PayingUsers]: chartConfigPayingUsers,
  [RAQIV2PredefinedChartKey.DailyRevenueBySource]: chartConfigDailyRevenueBySource,
  [RAQIV2PredefinedChartKey.AverageRevenuePerDailyActiveUser]:
    chartConfigAverageRevenuePerDailyActiveUser,
  [RAQIV2PredefinedChartKey.AverageRevenuePerPayingUser]: chartConfigAverageRevenuePerPayingUser,
  [RAQIV2PredefinedChartKey.ConversionRate]: chartConfigConversionRate,
  [RAQIV2PredefinedChartKey.AcquisitionNewUsersWithPlaysV2]:
    chartConfigAcquisitionNewUsersWithPlaysV2,
  [RAQIV2PredefinedChartKey.AcquisitionNewUsersWithImpressionsV2]:
    chartConfigAcquisitionNewUsersWithImpressionsV2,
  [RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithPlaysV2]:
    chartConfigAcquisitionReturningUsersWithPlaysV2,
  [RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithImpressionsV2]:
    chartConfigAcquisitionReturningUsersWithImpressionsV2,
  [RAQIV2PredefinedChartKey.AcquisitionNewUsersWithPlaysV2Migration]:
    chartConfigAcquisitionNewUsersWithPlaysV2Migration,
  [RAQIV2PredefinedChartKey.AcquisitionNewUsersWithImpressionsV2Migration]:
    chartConfigAcquisitionNewUsersWithImpressionsV2Migration,
  [RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithPlaysV2Migration]:
    chartConfigAcquisitionReturningUsersWithPlaysV2Migration,
  [RAQIV2PredefinedChartKey.AcquisitionReturningUsersWithImpressionsV2Migration]:
    chartConfigAcquisitionReturningUsersWithImpressionsV2Migration,
  [RAQIV2PredefinedChartKey.TopSourcesByNewUsersWithPlays]:
    chartConfigTopSourcesByNewUsersWithPlays,
  [RAQIV2PredefinedChartKey.TopSourcesByNewUsersWithPlaysMigration]:
    chartConfigTopSourcesByNewUsersWithPlaysMigration,
  [RAQIV2PredefinedChartKey.TopSourcesBy30DRevenuePerUser]:
    chartConfigTopSourcesBy30DRevenuePerUser,
  [RAQIV2PredefinedChartKey.TopSourcesBy30DRevenuePerUserMigration]:
    chartConfigTopSourcesBy30DRevenuePerUserMigration,
  [RAQIV2PredefinedChartKey.PerformanceClientFps]: chartConfigPerformanceClientFps,
  [RAQIV2PredefinedChartKey.PerformanceClientMemoryUsage]: chartConfigPerformanceClientMemoryUsage,
  [RAQIV2PredefinedChartKey.PerformanceClientMemoryUsagePercentage]:
    chartConfigPerformanceClientMemoryUsagePercentage,
  [RAQIV2PredefinedChartKey.PerformanceClientCrashRate]: chartConfigPerformanceClientCrashRate,
  [RAQIV2PredefinedChartKey.PerformanceSessionTime]: chartConfigPerformanceSessionTime,
  [RAQIV2PredefinedChartKey.PerformanceConcurrentPlayers]:
    chartConfigPerformancePeakConcurrentPlayers,
  [RAQIV2PredefinedChartKey.PerformanceServerFps]: chartConfigPerformanceServerFps,
  [RAQIV2PredefinedChartKey.PerformanceServerFpsV2]: chartConfigPerformanceServerFpsV2,
  [RAQIV2PredefinedChartKey.PerformanceServerCpuEfficiency]:
    chartConfigPerformanceServerCpuEfficiency,
  [RAQIV2PredefinedChartKey.PerformanceServerMemoryUsage]: chartConfigPerformanceServerMemoryUsage,
  [RAQIV2PredefinedChartKey.PerformanceServerCpuUsage]: chartConfigPerformanceServerCpuUsage,
  [RAQIV2PredefinedChartKey.PerformanceServerCpuUsageV2]: chartConfigPerformanceServerCpuUsageV2,
  [RAQIV2PredefinedChartKey.OverviewMiniConcurrentPlayers]:
    chartConfigOverviewMiniConcurrentPlayers,
  [RAQIV2PredefinedChartKey.PerformanceServerCpuTimeV2]: chartConfigPerformanceServerCpuTimeV2,
  [RAQIV2PredefinedChartKey.PerformanceServerMemoryUsageV2]:
    chartConfigPerformanceServerMemoryUsageV2,
  [RAQIV2PredefinedChartKey.PerformanceServerMemoryUsageByAge]:
    chartConfigPerformanceServerMemoryUsageByAge,
  [RAQIV2PredefinedChartKey.CustomEventsMigration]: chartConfigCustomEventsMigration,
  [RAQIV2PredefinedChartKey.FunnelCohortCompletionRate]: chartConfigFunnelCohortCompletionRate,
  [RAQIV2PredefinedChartKey.FunnelCohortSessionCompletionRate]:
    chartConfigFunnelCohortSessionCompletionRate,
  [RAQIV2PredefinedChartKey.ThumbnailQualifiedPTR]: chartConfigThumbnailQualifiedPTR,
  [RAQIV2PredefinedChartKey.ThumbnailL7QualifiedPTR]: chartConfigThumbnailL7QualifiedPTR,
  [RAQIV2PredefinedChartKey.ThumbnailImpressions]: chartConfigThumbnailImpressions,
  [RAQIV2PredefinedChartKey.HomeRecommendationImpressions]:
    chartConfigHomeRecommendationImpressions,
  [RAQIV2PredefinedChartKey.HomeRecommendationPlays]: chartConfigHomeRecommendationPlays,
  [RAQIV2PredefinedChartKey.RFYPlayThroughRate]: chartConfigRFYPlayThroughRate,
  [RAQIV2PredefinedChartKey.RFYL7PlayDays]: chartConfigRFYL7PlayDays,
  [RAQIV2PredefinedChartKey.RFYL7PlayTime]: chartConfigRFYL7PlayTime,
  [RAQIV2PredefinedChartKey.RFYL7RobuxSpent]: chartConfigRFYL7RobuxSpent,
  [RAQIV2PredefinedChartKey.RFYL7RobuxSpentDays]: chartConfigRFYL7RobuxSpentDays,
  [RAQIV2PredefinedChartKey.RFYL7IntentionalCoplayDays]: chartConfigRFYL7IntentionalCoplayDays,
  [RAQIV2PredefinedChartKey.RFYDeepEngagementRate]: chartConfigRFYDeepEngagementRate,
  [RAQIV2PredefinedChartKey.RFYQualifiedPTR]: chartConfigRFYQualifiedPTR,
  [RAQIV2PredefinedChartKey.PlayerFeedbackVotesCountByVoteType]:
    chartConfigPlayerFeedbackVotesCountByVoteType,
  [RAQIV2PredefinedChartKey.QualifiedPTRAndImpressionComparison]:
    chartConfigQualifiedPTRAndImpressionComparison,
  [RAQIV2PredefinedChartKey.DauMauStickiness]: chartConfigDauMauStickiness,
  [RAQIV2PredefinedChartKey.CommerceImpressions]: chartConfigCommerceImpressions,
  [RAQIV2PredefinedChartKey.CommerceClicks]: chartConfigCommerceClicks,
  [RAQIV2PredefinedChartKey.CommerceCheckouts]: chartConfigCommerceCheckouts,
  [RAQIV2PredefinedChartKey.CommerceOrders]: chartConfigCommerceOrders,
  [RAQIV2PredefinedChartKey.CommerceUniqueImpressions]: chartConfigCommerceUniqueImpressions,
  [RAQIV2PredefinedChartKey.CommerceUniqueClicks]: chartConfigCommerceUniqueClicks,
  [RAQIV2PredefinedChartKey.CommerceUniqueCheckouts]: chartConfigCommerceUniqueCheckouts,
  [RAQIV2PredefinedChartKey.CommerceUniqueOrders]: chartConfigCommerceUniqueOrders,
  [RAQIV2PredefinedChartKey.CommerceGMV]: chartConfigCommerceGMV,
  [RAQIV2PredefinedChartKey.CommerceQuantitySold]: chartConfigCommerceQuantitySold,
  [RAQIV2PredefinedChartKey.SponsoredAdPlays]: chartConfigSponsoredAdPlays,
};

export type ChartConfigOrPredefinedKey = TRAQIV2PredefinedChartKey | ChartConfig;
export type ChartConfigWithPredefinedKey = ChartConfig & { chartKey: TRAQIV2PredefinedChartKey };

const getConfigFromKeyOrConfig = (chartKeyOrConfig: ChartConfigOrPredefinedKey): ChartConfig => {
  return typeof chartKeyOrConfig === 'string'
    ? RAQIV2PredefinedChartConfig[chartKeyOrConfig]
    : chartKeyOrConfig;
};

/** We don't expose the entire config,
 * but we need to know which metrics are showing
 * so that we can implement explore mode based on the client config. */
export const getMetricsFromPredefinedChart = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
): NonEmptyArray<TRAQIV2NumericUIMetric> => {
  const config = getConfigFromKeyOrConfig(chartKeyOrConfig);
  if (isMultiMetricChartConfig(config)) {
    return mapNonEmptyArray(config.metricsConfig, (metricConfig) => metricConfig.metric);
  }
  return [config.metric];
};

export const getFirstMetricFromPredefinedChart = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
): TRAQIV2NumericUIMetric => {
  return getMetricsFromPredefinedChart(chartKeyOrConfig)[0];
};

export const getNonMetricRelatedConfigFromPredefinedChart = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
): Omit<ChartConfig, 'metric' | 'metricConfig' | 'overrides'> => {
  const config = getConfigFromKeyOrConfig(chartKeyOrConfig);
  if (isMultiMetricChartConfig(config)) {
    const { metricsConfig, ...commonConfig } = config;
    return commonConfig;
  }
  const { metric, overrides, ...commonConfig } = config;
  return commonConfig;
};

export const getMetricRelatedConfigFromPredefinedChart = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
): [MetricConfig, ...MetricConfig[]] => {
  const config = getConfigFromKeyOrConfig(chartKeyOrConfig);
  if (isMultiMetricChartConfig(config)) {
    return config.metricsConfig;
  }
  return [{ metric: config.metric, overrides: config.overrides }];
};

type PartialPredefinedChartConfig = Omit<ChartConfig, 'metric' | 'metricConfig' | 'overrides'>;

export const getOverlays = (
  partialConfig: PartialPredefinedChartConfig,
): ChartOverlays | undefined => {
  return partialConfig.overlays;
};

export const getDisplayOptions = (
  partialConfig: PartialPredefinedChartConfig,
): ChartConfigDisplayOptions | undefined => {
  const result: ChartConfigDisplayOptions = {};
  if ('labelDataAsPercent' in partialConfig) {
    result.labelDataAsPercent = !!partialConfig.labelDataAsPercent;
  }
  if ('hideTotalSeriesInChart' in partialConfig) {
    result.hideTotalSeriesInChart = !!partialConfig.hideTotalSeriesInChart;
  }
  if ('tooltipDataAsPercent' in partialConfig) {
    result.tooltipDataAsPercent = !!partialConfig.tooltipDataAsPercent;
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

export const getTitleKeyFromPredefinedChart = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
  context?: ChartDisplayContext,
): TranslationKey => {
  const config = getConfigFromKeyOrConfig(chartKeyOrConfig);

  // Use context-specific title if available
  if (context && config.titleKeyByContext?.[context]) {
    return config.titleKeyByContext[context];
  }

  return config.titleKey;
};

export const getTooltipKeyFromPredefinedChart = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
): TranslationKey | undefined => {
  return getConfigFromKeyOrConfig(chartKeyOrConfig).definitionTooltipKey;
};

export const getChartTypeFromPredefinedChart = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
  chartContext?: RAQIV2ChartContext,
): ChartType => {
  // We cannot display none granularity with a spline chart
  if (
    chartContext &&
    chartContext.granularity === RAQIV2MetricGranularity.None &&
    getConfigFromKeyOrConfig(chartKeyOrConfig).chartType === ChartType.Spline
  ) {
    return ChartType.Bar;
  }

  return getConfigFromKeyOrConfig(chartKeyOrConfig).chartType;
};

export const getExploreModeChartType = (
  preset: TRAQIV2PredefinedChartKey | null,
  metric: TRAQIV2UIMetric,
  chartContext: RAQIV2ChartContext,
  options?: { isExecutingComputedMetric?: boolean },
): ChartType => {
  if (options?.isExecutingComputedMetric) {
    return chartContext.granularity === RAQIV2MetricGranularity.None
      ? ChartType.Bar
      : ChartType.Spline;
  }
  const chartTypeFromPresetOrMetric = preset
    ? getChartTypeFromPredefinedChart(preset, chartContext)
    : getAnalyticsMetricDisplayConfig(metric).exploreModeChartType;

  const { breakdown, granularity } = chartContext;
  if (granularity === RAQIV2MetricGranularity.None) {
    // If granularity is set to none, depending on predefined chart type, we may
    // want to switch to either:
    // - Duration spline/area chart for metrics that are duration based
    // - Pie chart for categorical breakdowns
    // - or Bar chart for cumulative stats
    return chartTypeFromPresetOrMetric === ChartType.DurationSpline ||
      chartTypeFromPresetOrMetric === ChartType.DurationArea ||
      chartTypeFromPresetOrMetric === ChartType.Pie
      ? chartTypeFromPresetOrMetric
      : ChartType.Bar;
  }

  if (breakdown && breakdown.some(isMetricFanoutDimension)) {
    return ChartType.Spline;
  }
  return chartTypeFromPresetOrMetric ?? ChartType.Spline;
};

export const getPredefinedChartKey = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
): RAQIV2PredefinedChartKey | undefined => {
  const config = getConfigFromKeyOrConfig(chartKeyOrConfig);
  return config.chartKey && isValidEnumValue(RAQIV2PredefinedChartKey, config.chartKey)
    ? config.chartKey
    : undefined;
};

export const getUniqueKeyForChartConfig = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
): UniqueKeyForAnalyticsComponent => {
  return getUniqueKeyForKeyOrConfig(chartKeyOrConfig, getConfigFromKeyOrConfig);
};

/**
 * Resolves the quota line config for a predefined chart by reading the
 * `quotaConfig` from its primary metric's display config (sourced from the
 * developer-analytics metric YAML). Only spline charts surface quota lines.
 *
 * Returns `undefined` when the metric has no `quotaConfig`, when the variant
 * is `Metric` but the companion metric isn't a numeric UI metric we can
 * render, or when the chart isn't a spline chart.
 */
export const getQuotaConfigFromPredefinedChart = (
  chartKeyOrConfig: ChartConfigOrPredefinedKey,
): QuotaConfig | undefined => {
  const config = getConfigFromKeyOrConfig(chartKeyOrConfig);
  if (config.chartType !== ChartType.Spline || isMultiMetricChartConfig(config)) {
    return undefined;
  }
  return getQuotaConfigForMetric(config.metric);
};
