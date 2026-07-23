import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import {
  AnalyticsComponentType,
  ChartConfig,
  RAQIV2SummaryType,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

export const chartConfigRawAudioErrors = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.RawAudioErrors', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RawAudioErrors',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.TextToSpeechRawAudioErrors,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.TextToSpeechRawAudioStatus],
    },
  },
  chartType: ChartType.Spline,

  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigRawAudioSuccesses = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.RawAudioSuccesses', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.RawAudioSuccesses',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.TextToSpeechRawAudioSuccesses,
  overrides: {},
  chartType: ChartType.Spline,
  quotaMetric: RAQIV2Metric.TextToSpeechRawAudioQuota,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;
