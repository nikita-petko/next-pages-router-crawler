import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  V1AssetsGetFormatEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/client-thumbnails/v1';
import { getThumbnailsClient } from '@rbx/thumbnails';
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
      const response = await getThumbnailsClient().getAssets(
        stableAssetIds,
        V1AssetsGetReturnPolicyEnum.PlaceHolder,
        // eslint-disable-next-line no-underscore-dangle -- generated thumbnail sizes use API names
        V1AssetsGetSizeEnum._700x700,
        V1AssetsGetFormatEnum.Webp,
        false,
      );

      return (response.data ?? []).reduce((urls, thumbnail) => {
        if (thumbnail.targetId != null && thumbnail.imageUrl != null) {
          urls.set(thumbnail.targetId, thumbnail.imageUrl);
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
