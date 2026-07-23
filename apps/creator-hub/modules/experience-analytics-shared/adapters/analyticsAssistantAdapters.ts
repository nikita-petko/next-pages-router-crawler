import type {
  FeatureAttributes,
  Recommendation,
  Signal,
} from '@rbx/client-universe-analytics-insights/v1';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type {
  TAnalyticsProductRecommendation,
  TAnalyticsProductRecommendationType,
  TAnalyticsNonProductRecommendation,
  TAnalyticsNonProductRecommendationType,
  TAnalyticsAssistantReportSectionRecommendation,
} from '../types/assistant/AnalyticsAssistantRecommendations';
import {
  AnalyticsProductRecommendation,
  AnalyticsNonProductRecommendation,
  AnalyticsAssistantRecommendationType,
} from '../types/assistant/AnalyticsAssistantRecommendations';
import { InsightTypeV2 } from '../types/insights';

export const adaptSummaryReportDateRange = (
  signals: Signal[],
  insightType: InsightTypeV2.SummaryReport | InsightTypeV2.SummaryReport7Days,
): {
  startDate: Date;
  endDate: Date;
} => {
  if (signals.length === 0) {
    throw new Error('SummaryReport evidence missing signals data');
  }

  const endDates = signals
    .map((signal) => signal.endUtcTime)
    .filter((date): date is string => !!date)
    .map((date) => new Date(date));

  if (endDates.length === 0) {
    throw new Error('No valid dates found in signals');
  }

  const daysOffset = insightType === InsightTypeV2.SummaryReport7Days ? 6 : 27;
  const endDate = new Date(Math.max(...endDates.map((d) => d.getTime())));
  const startDate = new Date(endDate.getTime() - daysOffset * 24 * 60 * 60 * 1000);

  return { startDate, endDate };
};

export const adaptProductRecommendations = (
  recommendations?: Recommendation[],
): TAnalyticsProductRecommendation[] => {
  return (
    recommendations
      ?.filter(
        (
          recommendation,
        ): recommendation is {
          recommendationType: TAnalyticsProductRecommendationType;
          attributes?: FeatureAttributes;
        } =>
          recommendation.recommendationType !== undefined &&
          isValidArrayEnumValue(AnalyticsProductRecommendation, recommendation.recommendationType),
      )
      .map((recommendation) => ({
        type: AnalyticsAssistantRecommendationType.Product,
        recommendationType: recommendation.recommendationType,
        attributes: recommendation.attributes,
      })) || []
  );
};

export const adaptNonProductRecommendations = (
  recommendations?: Recommendation[],
): TAnalyticsNonProductRecommendation[] => {
  return (
    recommendations
      ?.filter(
        (rec): rec is { recommendationType: TAnalyticsNonProductRecommendationType } =>
          rec.recommendationType !== undefined &&
          isValidArrayEnumValue(AnalyticsNonProductRecommendation, rec.recommendationType),
      )
      .map((rec) => ({
        type: AnalyticsAssistantRecommendationType.NonProduct,
        recommendationType: rec.recommendationType,
      })) || []
  );
};

const hasAnalyticsProductRecommendations = (recommendations?: Recommendation[]): boolean => {
  if (!recommendations) {
    return false;
  }

  return recommendations.some(
    (rec) =>
      rec.recommendationType &&
      isValidArrayEnumValue(AnalyticsProductRecommendation, rec.recommendationType),
  );
};

// NOTE(lucaswang, 2025-06-20): Recommendations fall into two categories:
// 1. Product recommendations: These are the recommendations that are displayed in the Recommendations component
// 2. Non-product recommendations: These are the recommendations that are uniquely handled, e.g. "View Feedback Report"
// The product recommendations are snooze-able but the non-product recommendations are not.
// The two categories are handled differently in the report and should be mutually exclusive.
export const adaptAnalyticsAssistantRecommendations = (
  onlineRecommendations: TAnalyticsProductRecommendation[],
  sectionRecommendations?: Recommendation[],
): TAnalyticsAssistantReportSectionRecommendation | undefined => {
  const recs = sectionRecommendations ?? [];

  if (hasAnalyticsProductRecommendations(recs)) {
    // NOTE(lucaswang, 2025-06-20): We need to filter the recommendations to only include the ones that are present in the online recommendations.
    // This is because the recommendations are snooze-able but the section recommendations are embedded into the report at generation time.
    const onlineRecommendationTypes = new Set(
      onlineRecommendations.map((rec) => rec.recommendationType),
    );
    const productRecs = adaptProductRecommendations(recs).filter((rec) =>
      onlineRecommendationTypes.has(rec.recommendationType),
    );
    return productRecs.length > 0
      ? {
          type: AnalyticsAssistantRecommendationType.Product,
          recommendations: productRecs,
        }
      : undefined;
  }

  const nonProductRecs = adaptNonProductRecommendations(recs);
  return nonProductRecs.length > 0
    ? {
        type: AnalyticsAssistantRecommendationType.NonProduct,
        recommendation: nonProductRecs[0],
      }
    : undefined;
};
