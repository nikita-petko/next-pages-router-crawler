import { useCallback } from 'react';
import type { Insight } from '@modules/clients/analytics';
import { InsightTypeV2 } from '@modules/clients/analytics';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import {
  useGetInsights,
  useGetMostRecentInsights,
} from '@modules/react-query/universeAnalyticsInsights';
import { useGetInsightByInsightId } from '@modules/react-query/universeAnalyticsInsights/useUniverseAnalyticsInsightsQueries';
import adaptFeedbackReport from '../adapters/feedbackInsightAdapter';
import {
  adaptPercentChangeInsight,
  adaptLowEndAndroidCrashRateInsight,
  adaptQualitySignalInsight,
  adaptPeriodHighInsight,
  adaptAdsPerformanceInsight,
  adaptSummaryReport,
  adaptSummaryReport7Days,
} from '../adapters/universeAnalyticsInsightsAdapters';
import type {
  FeedbackReportCardSpec,
  InsightAchievementSpec,
  InsightCardSpec,
  SummaryReport7DaysCardSpec,
  SummaryReportCardSpec,
} from '../types/insights';
import { hasValidReportSummary } from '../types/insights';
import useApiRequest from './useApiRequest';

const maxAchievementNumber = 3;
const maxPercentChangeNumber = 2;
const maxLowEndAndroidCrashRateNumber = 1;
const maxQualitySignalCardsNumber = 3;
const maxSummaryReportNumber = 12;
const maxSummaryReport7DaysNumber = 12;
const maxFeedbackReportNumber = 1;

async function buildLowEndAndroidCrashRateSpecs(
  insightsData: Insight[],
): Promise<InsightCardSpec[]> {
  return Promise.all(
    insightsData
      .filter((insight) => insight.insightType === InsightTypeV2.LowEndAndroidCrashRate)
      .slice(0, maxLowEndAndroidCrashRateNumber)
      .map(async (insight) => {
        const placeId = insight.lowEndAndroidCrashRateEvidence?.mostCrashedPlaceId;
        if (!placeId) {
          return adaptLowEndAndroidCrashRateInsight(insight);
        }

        // Originally part of InsightsOverviewContent.tsx:
        // TODO (@bxu - 2024/08/21): Figure out a cleaner way to either put this with the insight request, or build a
        //  separate useQuery hook that can fetch these, which depends on the output from insights data.
        const asset = await assetsUploadApiClient.getAsset(placeId, [FieldMask.DISPLAY_NAME]);
        return adaptLowEndAndroidCrashRateInsight(insight, asset);
      }),
  );
}

/** Shared by GetInsights and GetMostRecentInsights hooks below. */
async function buildInsightsV2SpecsFromInsights(insightsData: Insight[]) {
  const byType = Map.groupBy(insightsData, (insight) => insight.insightType);

  const take = <T>(type: InsightTypeV2, adapt: (i: Insight) => T, max?: number) => {
    const items = byType.get(type) ?? [];
    return (max != null ? items.slice(0, max) : items).map(adapt);
  };

  const percentChangeSpecs: InsightCardSpec[] = take(
    InsightTypeV2.PercentChange,
    adaptPercentChangeInsight,
    maxPercentChangeNumber,
  );

  const lowEndAndroidCrashRateSpecs = await buildLowEndAndroidCrashRateSpecs(
    (byType.get(InsightTypeV2.LowEndAndroidCrashRate) ?? []).slice(
      0,
      maxLowEndAndroidCrashRateNumber,
    ),
  );

  const qualitySignalSpecs: InsightCardSpec[] = take(
    InsightTypeV2.ExperienceQuality,
    adaptQualitySignalInsight,
    maxQualitySignalCardsNumber,
  );

  const achievementSpecs: InsightAchievementSpec[] = take(
    InsightTypeV2.PeriodHigh,
    adaptPeriodHighInsight,
    maxAchievementNumber,
  );

  const adsPerformanceSpecs: InsightCardSpec[] = take(
    InsightTypeV2.AdsPerformance7Days,
    adaptAdsPerformanceInsight,
  );

  const summaryReportSpecs: SummaryReportCardSpec[] = take(
    InsightTypeV2.SummaryReport,
    adaptSummaryReport,
    maxSummaryReportNumber,
  ).filter(hasValidReportSummary);

  const summaryReport7DaysSpecs: SummaryReport7DaysCardSpec[] = take(
    InsightTypeV2.SummaryReport7Days,
    adaptSummaryReport7Days,
    maxSummaryReport7DaysNumber,
  ).filter(hasValidReportSummary);

  const feedbackReport7DaysSpecs: FeedbackReportCardSpec[] = take(
    InsightTypeV2.PlayerFeedbackReport7Days,
    adaptFeedbackReport,
    maxFeedbackReportNumber,
  ).filter(hasValidReportSummary);

  const feedbackReport28DaysSpecs: FeedbackReportCardSpec[] = take(
    InsightTypeV2.PlayerFeedbackReport28Days,
    adaptFeedbackReport,
    maxFeedbackReportNumber,
  ).filter(hasValidReportSummary);

  return {
    insightCardSpecs: [
      ...summaryReportSpecs,
      ...summaryReport7DaysSpecs,
      ...feedbackReport7DaysSpecs,
      ...feedbackReport28DaysSpecs,
      ...adsPerformanceSpecs,
      ...percentChangeSpecs,
      ...lowEndAndroidCrashRateSpecs,
      ...qualitySignalSpecs,
    ],
    achievementSpecs,
  };
}

export const useGetInsightV2SpecByInsightId = (universeId: number, insightId?: string) => {
  const { data: insight } = useGetInsightByInsightId(universeId, insightId);

  const makeGetInsightRequest = useCallback(async () => {
    if (!insight) {
      return null;
    }

    switch (insight.insightType) {
      case InsightTypeV2.PercentChange:
        return {
          insightType: InsightTypeV2.PercentChange,
          spec: adaptPercentChangeInsight(insight),
        };
      case InsightTypeV2.LowEndAndroidCrashRate:
        return {
          insightType: InsightTypeV2.LowEndAndroidCrashRate,
          spec: adaptLowEndAndroidCrashRateInsight(insight),
        };
      case InsightTypeV2.ExperienceQuality:
        return {
          insightType: InsightTypeV2.ExperienceQuality,
          spec: adaptQualitySignalInsight(insight),
        };
      case InsightTypeV2.PeriodHigh:
        return {
          insightType: InsightTypeV2.PeriodHigh,
          spec: adaptPeriodHighInsight(insight),
        };
      case InsightTypeV2.AdsPerformance7Days:
        return {
          insightType: InsightTypeV2.AdsPerformance7Days,
          spec: adaptAdsPerformanceInsight(insight),
        };
      case InsightTypeV2.SummaryReport:
        return {
          insightType: InsightTypeV2.SummaryReport,
          spec: adaptSummaryReport(insight),
        };
      case InsightTypeV2.SummaryReport7Days:
        return {
          insightType: InsightTypeV2.SummaryReport7Days,
          spec: adaptSummaryReport7Days(insight),
        };
      case InsightTypeV2.PlayerFeedbackReport7Days:
      case InsightTypeV2.PlayerFeedbackReport28Days:
        return {
          insightType: insight.insightType,
          spec: adaptFeedbackReport(insight),
        };
      default:
        return null;
    }
  }, [insight]);

  return useApiRequest(makeGetInsightRequest);
};

const useInsightsV2SpecsApiRequest = (insightsData: Insight[] | undefined) => {
  const makeRequest = useCallback(async () => {
    if (!insightsData) {
      return { insightCardSpecs: [], achievementSpecs: [] };
    }
    return buildInsightsV2SpecsFromInsights(insightsData);
  }, [insightsData]);

  return useApiRequest(makeRequest);
};

/**
 * Insight card specs using GetInsights only (optional `createdBeforeUtcTime`).
 */
const useGetInsightsV2Specs = (
  universeId: number,
  enabledInsightTypes: InsightTypeV2[],
  limit?: number,
  createdBeforeUtcTime?: string,
) => {
  const { data: insightsData } = useGetInsights(
    universeId,
    enabledInsightTypes,
    limit,
    createdBeforeUtcTime,
  );
  return useInsightsV2SpecsApiRequest(insightsData);
};

/** Insight card specs using GetMostRecentInsights only. */
export const useGetMostRecentInsightsV2Specs = (
  universeId: number,
  enabledInsightTypes: InsightTypeV2[],
) => {
  const { data: insightsData } = useGetMostRecentInsights(universeId, enabledInsightTypes);
  return useInsightsV2SpecsApiRequest(insightsData);
};

export default useGetInsightsV2Specs;
