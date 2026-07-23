import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import {
  AnalyticsComponentType,
  ChartConfig,
  RAQIV2SummaryType,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

export const chartConfigTranscriptionStatuses = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.TranscriptionStatuses', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.TranscriptionStatuses',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.SpeechToTextTranscriptionStatuses,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.SpeechToTextTranscriptionStatus],
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

export const chartConfigTranscriptionQuotaUsage = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.TranscriptionQuotaUsage', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.TranscriptionQuotaUsage',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.SpeechToTextTranscriptionUsage,
  overrides: {},
  chartType: ChartType.Spline,
  quotaMetric: RAQIV2Metric.SpeechToTextTranscriptionQuota,
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;
