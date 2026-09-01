import {
  RAQIV2Metric,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import RAQIV2SummaryCardType from '@modules/experience-analytics-shared/constants/RAQIV2SummaryCardType';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

enum FunnelSummaryKeys {
  TotalFunnelUsers = 'TotalFunnelUsers',
  TotalFunnelSessions = 'TotalFunnelSessions',
  TotalUserConversion = 'TotalUserConversion',
  TotalSessionConversion = 'TotalSessionConversion',
  BiggestFunnelStepUserDrop = 'BiggestFunnelStepUserDrop',
  BiggestFunnelStepSessionDrop = 'BiggestFunnelStepSessionDrop',
}

export const summaryCardConfigBiggestFunnelStepUserDrop = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.BiggestFunnelStepUserDrop,
  cardType: RAQIV2SummaryCardType.TopBreakdown,
  metric: RAQIV2Metric.FunnelUserChurnRate,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  label: {
    key: translationKey('Label.Card.BiggestFunnelStepDrop', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalFunnelUsers = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.TotalFunnelUsers,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.FunnelUserTotalCount,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  label: {
    key: translationKey('Label.Card.TotalFunnelUsers', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalFunnelSessions = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.TotalFunnelSessions,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.FunnelStepTotalCount,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  label: {
    key: translationKey('Label.Card.TotalFunnelSessions', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalUserConversion = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.TotalUserConversion,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.FunnelUserOverallCompletionRate,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  label: {
    key: translationKey('Label.Card.TotalConversion', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalSessionConversion = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.TotalSessionConversion,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.FunnelStepOverallCompletionRate,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },
  label: {
    key: translationKey('Label.Card.TotalConversion', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigBiggestFunnelStepSessionDrop = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: FunnelSummaryKeys.BiggestFunnelStepSessionDrop,
  cardType: RAQIV2SummaryCardType.TopBreakdown,
  metric: RAQIV2Metric.FunnelStepChurnRate,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.FunnelStep],
    },
    granularity: {
      override: RAQIV2MetricGranularity.None,
    },
  },

  label: {
    key: translationKey('Label.Card.BiggestFunnelStepDrop', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;
