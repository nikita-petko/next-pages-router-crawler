import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import developClient from '@modules/clients/develop';
import { DEFAULT_STALE_TIME_MS } from '../constants/timeConstants';
import { getPlayerSupportCaptureTimesQueryKey } from '../queryKeys';

const EMPTY_CAPTURE_TIMES = new Map<number, Date>();

/**
 * Resolves when each capture on a ticket was uploaded. The ticket payload carries bare asset ids,
 * so the timestamp has to come from the asset details endpoint.
 */
const useTicketCaptureTimesQuery = (assetIds: readonly number[]) => {
  const stableAssetIds = useMemo(
    () => [...new Set(assetIds)].sort((left, right) => left - right),
    [assetIds],
  );

  return useQuery({
    queryKey: getPlayerSupportCaptureTimesQueryKey(stableAssetIds),
    queryFn: async () => {
      const response = await developClient.getAssetDetails([...stableAssetIds]);

      // Ids the endpoint can't resolve are dropped from `data` instead of failing the request, so
      // a short response is normal and every capture has to tolerate a missing entry.
      return (response.data ?? []).reduce((times, asset) => {
        if (asset.id != null && asset.created != null) {
          times.set(asset.id, asset.created);
        }
        return times;
      }, new Map<number, Date>());
    },
    enabled: stableAssetIds.length > 0,
    placeholderData: EMPTY_CAPTURE_TIMES,
    staleTime: DEFAULT_STALE_TIME_MS,
  });
};

export default useTicketCaptureTimesQuery;
