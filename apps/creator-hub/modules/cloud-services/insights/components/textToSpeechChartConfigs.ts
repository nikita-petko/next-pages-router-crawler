import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;
