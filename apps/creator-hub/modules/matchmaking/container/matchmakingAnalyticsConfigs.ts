import { translationKey } from '@modules/analytics-translations';
import { ChartType, subHours, getCurrentDate } from '@modules/charts-generic';
import {
  RAQIV2MetricGranularity,
  RAQIV2UIMetric,
  RAQIV2Dimension,
  RAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import { AnalyticsComponentType, ChartConfig } from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const chartConfigMatchmakingCategoricalCustomSignalsSimilarityRatio = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingCategoricalCustomSignalsSimilarityRatio,
  titleKey: translationKey(
    'Label.Metric.MatchmakingCategoricalCustomSignalsSimilarityRatio',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingCategoricalCustomSignalsSimilarityRatio',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingCategoricalCustomSignalsSimilarityRatio,
  overrides: {
    breakdown: {
      intersect: [RAQIV2Dimension.MatchmakingCategoricalCustomSignal],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingNumericCustomSignalsDifference = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingNumericCustomSignalsDifference,
  titleKey: translationKey(
    'Label.Metric.MatchmakingNumericCustomSignalsDifference',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingNumericCustomSignalsDifference',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingNumericCustomSignalsDifference,
  overrides: {
    breakdown: {
      intersect: [RAQIV2Dimension.MatchmakingNumericCustomSignal],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingPlayerAttributesLoadingStatusAvg = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingPlayerAttributesLoadingStatusAvg,
  titleKey: translationKey(
    'Label.Metric.MatchmakingPlayerAttributesLoadingStatusAvg',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingPlayerAttributesLoadingStatusAvg',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2Metric.MatchmakingPlayerAttributesLoadingStatusAvg,
  overrides: {
    breakdown: {
      intersect: [
        RAQIV2Dimension.MatchmakingAttribute,
        RAQIV2Dimension.MatchmakingPlayerAttributesLoadingStatus,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.OneMinute },
    timeSpec: {
      override: {
        // TODO(jira/WEBMATCH-7457): Revisit the product decision on this chart.
        snapGranularity: RAQIV2MetricGranularity.OneMinute,
        startTime: subHours(getCurrentDate(), 168),
        endTime: getCurrentDate(),
      },
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
  hideTotalSeriesInChart: true,
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsAgeDifference = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsAgeDifference,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsAgeDifference',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsAgeDifference',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingSignalsAgeDifference,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsCommonDeviceTypeRatio = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsCommonDeviceTypeRatio,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsCommonDeviceTypeRatio',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsCommonDeviceTypeRatio',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingSignalsCommonDeviceTypeRatio,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsCommonLanguageRatio = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsCommonLanguageRatio,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsCommonLanguageRatio',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsCommonLanguageRatio',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingSignalsCommonLanguageRatio,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsEstimatePing = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsEstimatePing,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsEstimatedPing',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsEstimatedPing',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingSignalsEstimatePing,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsOccupancyRatio = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsOccupancyRatio,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsOccupancyRatio',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsOccupancyRatio',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingSignalsOccupancyRatio,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsPlayHistoryDifference = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsPlayHistoryDifference,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsPlayHistoryDifference',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsPlayHistoryDifference',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingSignalsPlayHistoryDifference,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsPreferredPlayerMatchRatioAvg = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsPreferredPlayerMatchRatioAvg,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsFriendsMatchRatioAvg',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsFriendsMatchRatioAvg',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2Metric.MatchmakingSignalsPreferredPlayerMatchRatioAvg,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsCommonChatGroupRatio = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsCommonLanguageRatio,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsCommonChatGroupRatio',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsCommonChatGroupRatio',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingSignalsCommonChatGroupRatio,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigMatchmakingSignalsVoiceChatRatio = {
  type: AnalyticsComponentType.Chart,
  // previously RAQIV2PredefinedChartKey.MatchmakingSignalsVoiceChatRatio,
  titleKey: translationKey(
    'Label.Metric.MatchmakingSignalsVoiceChatRatio',
    TranslationNamespace.Matchmaking,
  ),
  definitionTooltipKey: translationKey(
    'Description.MatchmakingSignalsVoiceChatRatio',
    TranslationNamespace.Matchmaking,
  ),
  metric: RAQIV2UIMetric.MatchmakingSignalsVoiceChatRatio,
  overrides: {},
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;
