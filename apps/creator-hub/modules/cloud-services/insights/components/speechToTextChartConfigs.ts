import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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
  overlays: [],
  hideTotalSeriesInChart: false,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.QuotaPercentageUsage }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;
