import { InsightTypeV2 } from '@modules/experience-analytics-shared';

export const AssistantSummaryInsightType = [
  InsightTypeV2.SummaryReport,
  InsightTypeV2.SummaryReport7Days,
  InsightTypeV2.PlayerFeedbackReport7Days,
  InsightTypeV2.PlayerFeedbackReport28Days,
  InsightTypeV2.MetricsSummary,
] as const;
export type TAssistantSummaryInsight = (typeof AssistantSummaryInsightType)[number];

export const isSummaryReport = (
  t: TAssistantSummaryInsight,
): t is InsightTypeV2.SummaryReport | InsightTypeV2.SummaryReport7Days => {
  return t === InsightTypeV2.SummaryReport || t === InsightTypeV2.SummaryReport7Days;
};

export const isPlayerFeedbackReport = (
  t: TAssistantSummaryInsight,
): t is InsightTypeV2.PlayerFeedbackReport7Days | InsightTypeV2.PlayerFeedbackReport28Days => {
  return (
    t === InsightTypeV2.PlayerFeedbackReport7Days || t === InsightTypeV2.PlayerFeedbackReport28Days
  );
};

export const isMetricsSummary = (
  t: TAssistantSummaryInsight,
): t is InsightTypeV2.MetricsSummary => {
  return t === InsightTypeV2.MetricsSummary;
};
