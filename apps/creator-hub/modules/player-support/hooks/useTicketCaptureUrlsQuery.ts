import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import assetdeliveryClient from '@modules/clients/assetdelivery';
import { DEFAULT_STALE_TIME_MS } from '../constants/timeConstants';
import { getPlayerSupportCaptureUrlsQueryKey } from '../queryKeys';

const EMPTY_CAPTURE_URLS = new Map<number, string>();

/**
 * Resolves the capture asset ids on a ticket to image URLs. `Thumbnail2d` renders captures in the
 * activity timeline without exposing its URL, so the full-screen inspector needs its own lookup.
 */
const useTicketCaptureUrlsQuery = (assetIds: readonly number[]) => {
  const stableAssetIds = useMemo(
    () => [...new Set(assetIds)].sort((left, right) => left - right),
    [assetIds],
  );

  return useQuery({
    queryKey: getPlayerSupportCaptureUrlsQueryKey(stableAssetIds),
    queryFn: async () => {
      const responses = await assetdeliveryClient.getAssets(
        stableAssetIds.map((assetId) => ({ assetId, requestId: String(assetId) })),
      );

      return responses.reduce((urls, item) => {
        if (item.requestId && item.location) {
          urls.set(Number(item.requestId), item.location);
        }
        return urls;
      }, new Map<number, string>());
    },
    enabled: stableAssetIds.length > 0,
    placeholderData: EMPTY_CAPTURE_URLS,
    staleTime: DEFAULT_STALE_TIME_MS,
  });
};

export default useTicketCaptureUrlsQuery;
