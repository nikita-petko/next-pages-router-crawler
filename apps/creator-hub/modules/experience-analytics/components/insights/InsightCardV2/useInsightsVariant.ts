import { useMemo } from 'react';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import type {
  InsightCardSpec,
  SummaryReport7DaysCardSpec,
  SummaryReportCardSpec,
} from '@modules/experience-analytics-shared/types/insights';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export enum InsightVariant {
  InsightCards = 'insight-cards',
  AssistantReportInsightCardV2 = 'assistant-report-insight-card-v2',
}

const AssistantRecommendationsCardInsightTypes = [
  InsightTypeV2.SummaryReport,
  InsightTypeV2.SummaryReport7Days,
] as const;

export const isAssistantRecommendationsCompatibleSpec = (
  spec: InsightCardSpec,
): spec is SummaryReportCardSpec | SummaryReport7DaysCardSpec => {
  // Check if the spec type is one of the allowed types
  if (!isValidArrayEnumValue(AssistantRecommendationsCardInsightTypes, spec.type)) {
    return false;
  }

  // Check if the spec has the reportSummary property
  return 'reportSummary' in spec;
};

const useInsightVariant = (insightCardSpecs: NonEmptyArray<InsightCardSpec>) => {
  const hasAssistantReportCardSpec = useMemo(
    () => insightCardSpecs.some(isAssistantRecommendationsCompatibleSpec),
    [insightCardSpecs],
  );

  // TODO(lucaswang, 2025-05-14): Fetch values from IXP to determine which variant to return.
  return hasAssistantReportCardSpec
    ? InsightVariant.AssistantReportInsightCardV2
    : InsightVariant.InsightCards;
};
export default useInsightVariant;
