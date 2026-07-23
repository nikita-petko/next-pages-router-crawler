import { useMemo } from 'react';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import { useGetInsights } from '@modules/react-query/universeAnalyticsInsights';

export type VideoServiceExtendedServicesInsightSpec = {
  universeId: number;
  snoozeKey: string;
};

/**
 * Returns the active `INSIGHT_TYPE_EXTENDED_SERVICES_VIDEO` insight (if any) for
 * the current universe so the Video Service page can surface the Extended
 * Services video recommendation card, mirroring the Extended Services compute
 * card on the Performance > Server tab.
 *
 * The backend factory (`ExtendedServicesVideoFactory` in developer-analytics PR
 * #3291) emits this insight when the `Viewed` share of total
 * `VideoServiceExclusivePlaybackSeconds` falls below the configured threshold,
 * so a non-null spec means we should surface the card. The insight carries no
 * evidence payload; the only data forwarded to the card is the universeId (for
 * routing the CTA) and the snoozeKey (for dismissing the insight).
 *
 * The spec is derived synchronously from the react-query result (which already
 * owns the fetch's loading/error lifecycle), so it is computed with `useMemo`
 * rather than routed through `useApiRequest`.
 */
const useGetVideoServiceExtendedServicesInsight = (): {
  data: VideoServiceExtendedServicesInsightSpec | null;
} => {
  const { id: universeId } = useUniverseResource();
  const { data: insightsData } = useGetInsights(universeId, [InsightTypeV2.ExtendedServicesVideo]);

  const data = useMemo<VideoServiceExtendedServicesInsightSpec | null>(() => {
    const matchingInsight = insightsData?.find(
      (insight) => insight.insightType === InsightTypeV2.ExtendedServicesVideo,
    );

    if (!matchingInsight) {
      return null;
    }

    return { universeId, snoozeKey: matchingInsight.snoozeKey };
  }, [insightsData, universeId]);

  return { data };
};

export default useGetVideoServiceExtendedServicesInsight;
