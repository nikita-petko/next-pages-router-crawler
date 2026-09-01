import { useQuery } from '@tanstack/react-query';
import assetdeliveryClient from '@modules/clients/assetdelivery';
import { GET_ASSET_IMAGE_URLS_QUERY_KEY } from '../../queryKeys';

/**
 * Resolves image asset ids to displayable URLs via the asset delivery service.
 *
 * Pass `accessContext` when fetching creator-owned pitch images as an IP holder.
 *
 * @returns a map of asset id -> image URL for assets that resolved successfully.
 */
export const useAssetImageUrlsQuery = (
  assetIds: number[],
  enabled = true,
  accessContext?: string,
) => {
  return useQuery({
    queryKey: GET_ASSET_IMAGE_URLS_QUERY_KEY(assetIds, accessContext),
    queryFn: async () => {
      const responses = await assetdeliveryClient.getAssets(
        assetIds.map((assetId) => ({
          assetId,
          requestId: String(assetId),
          ...(accessContext != null && accessContext !== '' ? { accessContext } : {}),
        })),
      );

      return responses.reduce((urls, item) => {
        if (item.requestId && item.location) {
          urls.set(Number(item.requestId), item.location);
        }
        return urls;
      }, new Map<number, string>());
    },
    enabled: enabled && assetIds.length > 0,
    staleTime: Infinity,
  });
};
