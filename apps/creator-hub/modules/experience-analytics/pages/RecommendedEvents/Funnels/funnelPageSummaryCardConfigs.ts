import { translationKey } from '@modules/analytics-translations';
import {
  AnalyticsComponentType,
  RAQIV2SummaryCardType,
  RAQIV2SummaryType,
  AnalyticsSummaryCardConfig,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

enum FunnelSummaryKeys {
  TotalFunnelUsersRealtime = 'TotalFunnelUsersRealtime',
  TotalFunnelSessionsRealtime = 'TotalFunnelSessionsRealtime',
  TotalUserConversionRealtime = 'TotalUserConversionRealtime',
  BiggestFunnelStepUserDropRealtime = 'BiggestFunnelStepUserDropRealtime',
}

export const summaryCardConfigBiggestFunnelStepUserDropRealtime = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.BiggestFunnelStepUserDropRealtime,
  cardType: RAQIV2SummaryCardType.TopBreakdown,
  metric: RAQIV2Metric.UserChurnRateRealtime,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
  },
  label: {
    key: translationKey('Label.Card.BiggestFunnelStepUserDrop', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalFunnelUsersRealtime = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.TotalFunnelUsersRealtime,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.FunnelUsersRealtime,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {},
  label: {
    key: translationKey('Label.Card.TotalFunnelUsers', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalFunnelSessionsRealtime = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.TotalFunnelSessionsRealtime,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.FunnelSessionsRealtime,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {},
  label: {
    key: translationKey('Label.Card.TotalFunnelSessions', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalUserConversionRealtime = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.TotalUserConversionRealtime,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.UserTotalConversionRateRealtime,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {},
  label: {
    key: translationKey('Label.Card.TotalUserConversion', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;
