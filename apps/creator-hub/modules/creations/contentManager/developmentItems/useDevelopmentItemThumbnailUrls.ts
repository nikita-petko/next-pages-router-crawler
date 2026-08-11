import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  V1AssetsGetFormatEnum,
  V1AssetsGetReturnPolicyEnum,
  V1AssetsGetSizeEnum,
} from '@rbx/client-thumbnails/v1';
import { getThumbnailsClient } from '@rbx/thumbnails';

const EMPTY_THUMBNAIL_URLS: ReadonlyMap<number, string> = new Map();
const THUMBNAIL_ASSET_IDS_PER_REQUEST = 50;
const THUMBNAIL_STALE_TIME_MS = 5 * 60_000;

export const fetchDevelopmentItemThumbnailUrls = async (
  assetIds: readonly number[],
  signal?: AbortSignal,
): Promise<ReadonlyMap<number, string>> => {
  if (signal?.aborted === true) {
    return EMPTY_THUMBNAIL_URLS;
  }

  const thumbnailClient = getThumbnailsClient();
  const batches: number[][] = [];
  for (let index = 0; index < assetIds.length; index += THUMBNAIL_ASSET_IDS_PER_REQUEST) {
    batches.push(assetIds.slice(index, index + THUMBNAIL_ASSET_IDS_PER_REQUEST));
  }

  const responses = await Promise.allSettled(
    batches.map((batch) =>
      thumbnailClient.getAssets(
        batch,
        V1AssetsGetReturnPolicyEnum.PlaceHolder,
        // eslint-disable-next-line no-underscore-dangle -- generated thumbnail sizes use API names
        V1AssetsGetSizeEnum._150x150,
        V1AssetsGetFormatEnum.Webp,
        false,
      ),
    ),
  );

  const urls = new Map<number, string>();
  responses.forEach((response) => {
    if (response.status !== 'fulfilled') {
      return;
    }
    response.value.data?.forEach((thumbnail) => {
      if (thumbnail.targetId != null && thumbnail.imageUrl != null) {
        urls.set(thumbnail.targetId, thumbnail.imageUrl);
      }
    });
  });

  const failedResponse = responses.find((response) => response.status === 'rejected');
  if (failedResponse != null && responses.every((response) => response.status === 'rejected')) {
    throw failedResponse.reason;
  }

  return urls;
};

const useDevelopmentItemThumbnailUrls = (assetIds: readonly number[]) => {
  const stableAssetIds = useMemo(
    () => [...new Set(assetIds)].sort((left, right) => left - right),
    [assetIds],
  );

  return useQuery({
    queryKey: ['development-item-thumbnail-urls-v2', stableAssetIds],
    queryFn: ({ signal }) => fetchDevelopmentItemThumbnailUrls(stableAssetIds, signal),
    enabled: stableAssetIds.length > 0,
    placeholderData: EMPTY_THUMBNAIL_URLS,
    staleTime: THUMBNAIL_STALE_TIME_MS,
  });
};

export default useDevelopmentItemThumbnailUrls;
