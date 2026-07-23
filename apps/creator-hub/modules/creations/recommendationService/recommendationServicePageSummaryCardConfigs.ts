import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import RAQIV2SummaryCardType from '@modules/experience-analytics-shared/constants/RAQIV2SummaryCardType';
import RAQIV2SummaryType from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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
