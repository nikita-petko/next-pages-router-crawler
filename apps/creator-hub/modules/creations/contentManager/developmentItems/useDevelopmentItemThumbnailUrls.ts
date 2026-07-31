import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  V1AssetsGetFormatEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/client-thumbnails/v1';
import { getThumbnailsClient } from '@rbx/thumbnails';

const EMPTY_THUMBNAIL_URLS: ReadonlyMap<number, string> = new Map();
const THUMBNAIL_STALE_TIME_MS = 5 * 60_000;

const useDevelopmentItemThumbnailUrls = (assetIds: readonly number[]) => {
  const stableAssetIds = useMemo(
    () => [...new Set(assetIds)].sort((left, right) => left - right),
    [assetIds],
  );

  return useQuery({
    queryKey: ['development-item-thumbnail-urls-v2', stableAssetIds],
    queryFn: async ({ signal }) => {
      if (signal.aborted) {
        return EMPTY_THUMBNAIL_URLS;
      }

      const thumbnailClient = getThumbnailsClient();
      const response = await thumbnailClient.getAssets(
        stableAssetIds,
        V1AssetsGetReturnPolicyEnum.PlaceHolder,
        // eslint-disable-next-line no-underscore-dangle -- generated thumbnail sizes use API names
        V1AssetsGetSizeEnum._150x150,
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
    placeholderData: EMPTY_THUMBNAIL_URLS,
    staleTime: THUMBNAIL_STALE_TIME_MS,
  });
};

export default useDevelopmentItemThumbnailUrls;
