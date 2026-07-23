import { useQuery } from '@tanstack/react-query';
import assetdeliveryClient from '@modules/clients/assetdelivery';
import { GET_PLACEFILE_IMAGE_URLS_QUERY_KEY } from '../../queryKeys';

/**
 * Resolves detected placefile image asset ids to displayable image URLs via the asset delivery
 * service. These detection-pipeline assets are not rendered by the thumbnails service, so their raw
 * content location is used directly (same pattern as experience media/thumbnail previews).
 *
 * @returns a map of asset id -> image URL for assets that resolved successfully.
 */
export const usePlacefileImageUrlsQuery = (assetIds: number[]) => {
  return useQuery({
    queryKey: GET_PLACEFILE_IMAGE_URLS_QUERY_KEY(assetIds),
    queryFn: async () => {
      const responses = await assetdeliveryClient.getAssets(
        assetIds.map((assetId) => ({ assetId, requestId: String(assetId) })),
      );

      return responses.reduce((acc, item) => {
        if (item.requestId && item.location) {
          acc.set(Number(item.requestId), item.location);
        }
        return acc;
      }, new Map<number, string>());
    },
    enabled: assetIds.length > 0,
    staleTime: Infinity,
  });
};
