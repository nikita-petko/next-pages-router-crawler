import { useCallback, useEffect, useMemo, useRef } from 'react';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { useGetInsightByInsightId } from '@modules/react-query/universeAnalyticsInsights/useUniverseAnalyticsInsightsQueries';
import { InsightTypeV2, useApiRequest } from '@modules/experience-analytics-shared';
import { AssistantSummaryInsightSpec } from '../types/AssistantSummaryInsightSpec';
import adaptSummaryReport, {
  adaptMetricsSummaryReport,
} from '../adapters/adaptSummaryReportInsight';
import { useAdaptFeedbackSummaryReport } from '../adapters/adaptFeedbackSummaryReportInsight';
import { AssistantSummaryInsightType } from '../types/AssistantSummaryInsightType';

const useGetAssistantSummaryInsightSpecByInsightId = (universeId: number, insightId?: string) => {
  const {
    data: insight,
    isPending,
    isFetching,
    isError,
  } = useGetInsightByInsightId(universeId, insightId);
  const adaptFeedbackSummaryReport = useAdaptFeedbackSummaryReport();
  const lastGoodSpecRef = useRef<AssistantSummaryInsightSpec | null>(null);
  const lastUniverseIdRef = useRef(universeId);

  useEffect(() => {
    if (lastUniverseIdRef.current !== universeId) {
      lastUniverseIdRef.current = universeId;
      lastGoodSpecRef.current = null;
    }
  }, [universeId]);

  const makeGetInsightRequest =
    useCallback(async (): Promise<AssistantSummaryInsightSpec | null> => {
      if (!insight || !isValidArrayEnumValue(AssistantSummaryInsightType, insight.insightType)) {
        return null;
      }

      switch (insight.insightType) {
        case InsightTypeV2.SummaryReport:
        case InsightTypeV2.SummaryReport7Days:
          return adaptSummaryReport(insight);
        case InsightTypeV2.PlayerFeedbackReport7Days:
        case InsightTypeV2.PlayerFeedbackReport28Days:
          return adaptFeedbackSummaryReport(insight);
        case InsightTypeV2.MetricsSummary:
          return adaptMetricsSummaryReport(insight);
        default: {
          const exhaustiveCheck: never = insight.insightType;
          throw new Error(`Unhandled insight type: ${exhaustiveCheck}`);
        }
      }
    }, [insight, adaptFeedbackSummaryReport]);

  const apiRequest = useApiRequest(makeGetInsightRequest);

  useEffect(() => {
    if (apiRequest.data && insightId !== undefined) {
      lastGoodSpecRef.current = apiRequest.data;
    }
  }, [apiRequest.data, insightId]);

  const data = useMemo(() => {
    if (apiRequest.data && insightId !== undefined) {
      return apiRequest.data;
    }

    const canAdaptInsight =
      insight !== undefined &&
      isValidArrayEnumValue(AssistantSummaryInsightType, insight.insightType);
    const insightMatchesUrl = insight !== undefined && insightId !== undefined;

    // React Query has the new insight but useApiRequest has not run yet (one-frame gap: no pending/fetching/loading).
    const awaitingAdaptationAfterNetwork =
      canAdaptInsight &&
      insightMatchesUrl &&
      apiRequest.data === null &&
      lastGoodSpecRef.current !== null;

    const shouldHoldPrevious =
      !isError &&
      insightId &&
      lastGoodSpecRef.current &&
      (isPending || isFetching || apiRequest.isDataLoading || awaitingAdaptationAfterNetwork);

    if (shouldHoldPrevious) {
      return lastGoodSpecRef.current;
    }

    return null;
  }, [
    apiRequest.data,
    apiRequest.isDataLoading,
    insight,
    insightId,
    isError,
    isFetching,
    isPending,
  ]);

  return {
    ...apiRequest,
    data,
  };
};

export default useGetAssistantSummaryInsightSpecByInsightId;
