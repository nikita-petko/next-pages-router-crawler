import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { PlacementType, normalizePlacements } from '../types/placementTypes';

// Scoping the Managed Rewarded tab to Play with Reward has to happen by placement
// id rather than by placement type. Only request and fill rows carry a placement
// type; impressions, earnings and reward grants come from the viewability event,
// which has none, so a type filter drops them entirely. Placement id is on every
// row, and the placement service is the only thing that knows which ids are Play
// with Reward, so the id set has to be resolved here and fed in as a page filter.
//
// Callers must treat an empty result as "cannot scope" rather than "no filter":
// `sanitizeFilterValuesForBackend` drops a filter whose values are empty, which
// would quietly widen the tab back to all rewarded video.
const usePlayWithRewardPlacementIds = (isEnabled: boolean) => {
  const { id: universeId } = useUniverseResource();

  const { data, isError, isLoading } = useQuery({
    queryKey: ['immersive-ads', 'play-with-reward-placement-ids', universeId],
    queryFn: () => developerAdsStatsClient.getPlacements({ universeId }),
    enabled: isEnabled && universeId > 0,
  });

  const placementIds = useMemo(
    () =>
      normalizePlacements(data ?? [])
        .filter((placement) => placement.type === PlacementType.PlayWithReward)
        .map((placement) => String(placement.id)),
    [data],
  );

  return { placementIds, isError, isLoading };
};

export default usePlayWithRewardPlacementIds;
