import { useCallback } from 'react';
import useApiRequest from '@modules/experience-analytics-shared/hooks/useApiRequest';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import { useGetInsights } from '@modules/react-query/universeAnalyticsInsights';

const EXTENDED_SERVICES_COMPUTE_INSIGHT_TYPES = [InsightTypeV2.ExtendedServicesCompute];

export type ExtendedServicesComputeInsightSpec = {
  universeId: number;
  snoozeKey: string;
};

/**
 * Returns the active `INSIGHT_TYPE_EXTENDED_SERVICES_COMPUTE` insight (if any)
 * for the current universe. The backend factory
 * (`ExtendedServicesComputeFactory` in developer-analytics) only emits an
 * insight when both physics-CPU-time avg and CPU-core-utilization max exceed
 * configured thresholds, so a non-null spec means we should surface the card.
 *
 * Uses the `/insights` endpoint rather than `/insights/most-recent` because
 * this insight is page-specific; the most-recent endpoint is reserved for the
 * ranked-insight overview surface.
 *
 * The evidence payload for this insight type is empty
 * (`Google.Protobuf.WellKnownTypes.Empty`); the only data we forward to the
 * card is the universeId for routing the CTA to the Extended Services unlock
 * page.
 */
const useGetExtendedServicesComputeInsight = () => {
  const { id: universeId } = useUniverseResource();
  const { data: insightsData } = useGetInsights(
    universeId,
    EXTENDED_SERVICES_COMPUTE_INSIGHT_TYPES,
  );

  const makeRequest = useCallback(async (): Promise<ExtendedServicesComputeInsightSpec | null> => {
    if (!insightsData) {
      return null;
    }

    const matchingInsight = insightsData.find(
      (insight) => insight.insightType === InsightTypeV2.ExtendedServicesCompute,
    );

    if (!matchingInsight) {
      return null;
    }

    return { universeId, snoozeKey: matchingInsight.snoozeKey };
  }, [insightsData, universeId]);

  return useApiRequest(makeRequest);
};

export default useGetExtendedServicesComputeInsight;
