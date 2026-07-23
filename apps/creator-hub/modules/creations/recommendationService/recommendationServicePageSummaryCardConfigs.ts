import { translationKey } from '@modules/analytics-translations';
import {
  AnalyticsComponentType,
  RAQIV2SummaryCardType,
  RAQIV2SummaryType,
  AnalyticsSummaryCardConfig,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';

enum RecommendationServiceSummaryKeys {
  CurrentConfiguration = 'CurrentConfiguration',
  TotalImpressions = 'TotalImpressions',
  TotalViewHours = 'TotalViewHours',
  TotalActions = 'TotalActions',
  TotalActionsPerUser = 'TotalActionsPerUser',
  UniqueUsers = 'UniqueUsers',
}

export const summaryCardConfigUniqueUsers = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: RecommendationServiceSummaryKeys.UniqueUsers,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.RecommendationDau,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {},
  label: {
    key: translationKey(
      'Label.Metric.RecommendationDau',
      TranslationNamespace.RecommendationService,
    ),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalViewHours = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: RecommendationServiceSummaryKeys.TotalViewHours,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.TotalViewHours,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {},
  label: {
    key: translationKey('Label.Card.TotalViewHours', TranslationNamespace.RecommendationService),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigUniqueItems = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: RecommendationServiceSummaryKeys.TotalViewHours,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.TotalViewHours,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {},
  label: {
    key: translationKey('Label.Card.TotalViewHours', TranslationNamespace.RecommendationService),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;
