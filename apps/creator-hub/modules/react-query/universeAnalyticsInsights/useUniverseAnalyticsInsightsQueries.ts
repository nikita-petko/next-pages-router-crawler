import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { MetricsSummaryInput } from '@rbx/client-universe-analytics-insights/v1';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { Insight, InsightTypeV2 } from '@modules/clients/analytics';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import GenerateMetricsSummaryNotDoneError from './errors/GenerateMetricsSummaryNotDoneError';
import GenerateMetricsSummaryTimeoutError from './errors/GenerateMetricsSummaryTimeoutError';
import {
  snoozeInsightRequest,
  getInsightsRequest,
  getInsightByInsightIdRequest,
  getMostRecentInsightsRequest,
  generateMetricsSummaryRequest,
} from './universeAnalyticsInsightsRequest';

export enum UniverseAnalyticsInsightsQueryKeys {
  GetInsights = 'getInsights',
  GetMostRecentInsights = 'getMostRecentInsights',
}

export const useSnoozeInsight = (
  universeId: number,
  insightType: InsightTypeV2,
  snoozeKey: string,
  snoozeDuration?: string,
) => {
  const queryClient = useQueryClient();

  const processInsight = (insight: Insight): Insight | undefined => {
    if (insight.snoozeKey === snoozeKey) {
      return undefined;
    }

    // Filter out snoozed recommendations
    return {
      ...insight,
      recommendations: (insight.recommendations || []).filter(
        (rec) => rec.recommendationType !== snoozeKey,
      ),
    };
  };

  const processCachedData = (old: Insight | Insight[] | undefined) => {
    if (!old) {
      return old;
    }

    if (Array.isArray(old)) {
      return old.map(processInsight).filter((insight): insight is Insight => insight !== undefined);
    }

    return processInsight(old);
  };

  return useMutation({
    mutationFn: () => {
      return snoozeInsightRequest(universeId, insightType, snoozeKey, snoozeDuration);
    },
    onMutate: () => {
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const { queryKey } = query;
            return (
              (queryKey[0] === UniverseAnalyticsInsightsQueryKeys.GetInsights &&
                queryKey[1] === universeId) ||
              (queryKey[0] === UniverseAnalyticsInsightsQueryKeys.GetMostRecentInsights &&
                queryKey[2] === universeId)
            );
          },
        },
        processCachedData,
      );
    },
    onError: (error) => {
      logAnalyticsError(`Error snoozing insight: ${error.message}`);
    },
  });
};

export const useGetInsights = (
  universeId: number,
  insightTypes: InsightTypeV2[],
  limit?: number,
  createdBeforeUtcTime?: string,
) => {
  return useQuery({
    // Include limit and cutoff so cache refetches when e.g. assistant report `endDate` loads after first paint.
    queryKey: [
      UniverseAnalyticsInsightsQueryKeys.GetInsights,
      universeId,
      ...insightTypes,
      limit ?? null,
      createdBeforeUtcTime ?? null,
    ],
    queryFn: () => {
      return getInsightsRequest(universeId, insightTypes, limit, createdBeforeUtcTime);
    },
    enabled: universeId !== uninitializedUniverseId,
  });
};

export const useGetInsightByInsightId = (universeId: number, insightId?: string) => {
  return useQuery({
    queryKey: [UniverseAnalyticsInsightsQueryKeys.GetInsights, universeId, insightId],
    queryFn: () => {
      return getInsightByInsightIdRequest(universeId, insightId);
    },
    enabled: universeId !== uninitializedUniverseId,
  });
};

export const useGetMostRecentInsights = (universeId: number, insightTypes: InsightTypeV2[]) => {
  return useQuery({
    queryKey: [
      UniverseAnalyticsInsightsQueryKeys.GetMostRecentInsights,
      'mostRecent',
      universeId,
      ...insightTypes,
    ],
    queryFn: () => getMostRecentInsightsRequest(universeId, insightTypes),
    enabled: universeId !== uninitializedUniverseId,
  });
};

export const useGenerateMetricsSummary = (
  universeId: number,
  metricsSummaryInput: MetricsSummaryInput,
  enabled: boolean = true,
  maxPolls: number = 30,
  pollInterval: number = 2000,
) => {
  return useQuery({
    queryKey: ['generateMetricsSummary', universeId, metricsSummaryInput],
    queryFn: () => generateMetricsSummaryRequest(universeId, metricsSummaryInput),
    retry: (failureCount, error) => {
      // Retry if the workflow is not done yet (still processing)
      if (error instanceof GenerateMetricsSummaryNotDoneError) {
        return failureCount < maxPolls;
      }

      // Retry if the request timed out (e.g., API gateway 3-second limit)
      // This handles the case where the backend returns { code: 0, message: "upstream request timeout" }
      if (error instanceof GenerateMetricsSummaryTimeoutError) {
        return failureCount < maxPolls;
      }

      // Don't retry on other errors (network errors, missing insight, validation errors, etc.)
      return false;
    },
    retryDelay: pollInterval,
    enabled: enabled && universeId !== uninitializedUniverseId,
  });
};
