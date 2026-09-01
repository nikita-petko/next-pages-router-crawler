import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import RAQIV2SummaryCardType from '@modules/experience-analytics-shared/constants/RAQIV2SummaryCardType';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

enum JourneySummaryKeys {
  TotalJourneyUsers = 'TotalJourneyUsers',
  TotalJourneySessions = 'TotalJourneySessions',
  TotalFinalStageUsers = 'TotalFinalStageUsers',
  TotalFinalStageSessions = 'TotalFinalStageSessions',
  BiggestDropNode = 'BiggestDropNode',
  BiggestDropNodeSessions = 'BiggestDropNodeSessions',
  BiggestDropStage = 'BiggestDropStage',
}

export const summaryCardConfigTotalJourneyUsers = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: JourneySummaryKeys.TotalJourneyUsers,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.JourneyTotalUsers,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: { granularity: { override: RAQIV2MetricGranularity.None } },
  label: {
    key: translationKey('Label.Card.TotalJourneyUsers', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalJourneySessions = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: JourneySummaryKeys.TotalJourneySessions,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.JourneyEntryTransitions,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: { granularity: { override: RAQIV2MetricGranularity.None } },
  label: {
    key: translationKey('Label.Card.TotalJourneySessions', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalFinalStageUsers = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: JourneySummaryKeys.TotalFinalStageUsers,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.JourneyCompletionUsers,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: { granularity: { override: RAQIV2MetricGranularity.None } },
  label: {
    key: translationKey('Label.Card.TotalFinalStageUsers', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigTotalFinalStageSessions = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: JourneySummaryKeys.TotalFinalStageSessions,
  cardType: RAQIV2SummaryCardType.Metric,
  metric: RAQIV2Metric.JourneyLastStageTransitions,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: { granularity: { override: RAQIV2MetricGranularity.None } },
  label: {
    key: translationKey('Label.Card.TotalFinalStageSessions', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigBiggestDropNode = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: JourneySummaryKeys.BiggestDropNode,
  cardType: RAQIV2SummaryCardType.TopBreakdown,
  metric: RAQIV2Metric.JourneyNodeUserChurnCount,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    breakdown: { override: [RAQIV2Dimension.FromNode] },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  label: {
    key: translationKey('Label.Card.BiggestDropEdge', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigBiggestDropNodeSessions = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: JourneySummaryKeys.BiggestDropNodeSessions,
  cardType: RAQIV2SummaryCardType.TopBreakdown,
  metric: RAQIV2Metric.JourneyNodeTransitionChurnCount,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    breakdown: { override: [RAQIV2Dimension.FromNode] },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  label: {
    key: translationKey('Label.Card.BiggestDropEdge', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigBiggestDropStage = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: JourneySummaryKeys.BiggestDropStage,
  cardType: RAQIV2SummaryCardType.TopBreakdown,
  metric: RAQIV2Metric.JourneyStageChurnRate,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    breakdown: { override: [RAQIV2Dimension.FromStage] },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
  label: {
    key: translationKey('Label.Card.BiggestDropStage', TranslationNamespace.Analytics),
    type: 'simple',
  },
} as const satisfies AnalyticsSummaryCardConfig;
