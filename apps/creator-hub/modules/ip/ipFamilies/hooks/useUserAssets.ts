import { useQuery } from '@tanstack/react-query';
import { useRobloxAuthentication } from '@rbx/auth';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import type { SupportedRobloxAssetTypeEnum } from '../constants';

export type UserAsset = {
  assetId: number;
  name: string;
};

// Upper bound on how many assets we fetch. Search is client-side over this set,
// so this caps the number of paginated requests made when the picker opens.
// We will migrate to server-side asset search (by Creator Content Understanding) when their search system is ready.
const MAX_ASSETS = 2000;

export const useSearchAssets = (assetType: SupportedRobloxAssetTypeEnum, keyword: string) => {
  const { user } = useRobloxAuthentication();

  return useQuery({
    queryKey: ['userAssets', user?.id, assetType],
    enabled: !!user,
    staleTime: Infinity,
    queryFn: async (): Promise<UserAsset[]> => {
      const results: UserAsset[] = [];
      let cursor: string | undefined;

      do {
        const response = await itemConfigurationClient.getCreations(
          assetType,
          false,
          undefined,
          100,
          cursor,
        );
        for (const item of response.data ?? []) {
          if (typeof item.assetId === 'number' && item.assetId > 0) {
            results.push({ assetId: item.assetId, name: item.name ?? '' });
          }
        }
        cursor = response.nextPageCursor ?? undefined;
      } while (cursor && results.length < MAX_ASSETS);

      return results;
    },
    select: (allAssets) => {
      if (!keyword) {
        return allAssets;
      }
      const lower = keyword.toLowerCase();
      return allAssets.filter((a) => a.name.toLowerCase().includes(lower));
    },
  });
};
