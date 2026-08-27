import { useAssetImageUrlsQuery } from './useAssetImageUrlsQuery';

/**
 * Resolves detected placefile image asset ids to displayable image URLs via the asset delivery
 * service. These detection-pipeline assets are not rendered by the thumbnails service, so their raw
 * content location is used directly (same pattern as experience media/thumbnail previews).
 *
 * @returns a map of asset id -> image URL for assets that resolved successfully.
 */
export const usePlacefileImageUrlsQuery = (assetIds: number[]) => {
  return useAssetImageUrlsQuery(assetIds);
};
