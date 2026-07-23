import type { ListingResponse } from '@rbx/client-content-licensing-api/v1';

type ThumbnailAssetIds = ListingResponse['thumbnailAssetIds'];

/**
 * Gallery asset ids from a listing, normalized to a mutable array (`[]` when missing or empty).
 */
export function getListingThumbnailAssetIds(thumbnailAssetIds: ThumbnailAssetIds): number[] {
  if (!thumbnailAssetIds?.length) {
    return [];
  }
  return [...thumbnailAssetIds];
}

/**
 * First gallery asset id from a listing, or `undefined` when none.
 */
export function getFirstListingThumbnailAssetId(
  thumbnailAssetIds: ThumbnailAssetIds,
): number | undefined {
  return getListingThumbnailAssetIds(thumbnailAssetIds)[0];
}
