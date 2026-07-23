import { createContext, useContext, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ThumbnailClient, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';

import {
  DeveloperAnalyticsAggregationsClientWrapper,
  developerAnalyticsAggregationsClient,
} from '@modules/clients/analytics';

import developerProductsClient, {
  type BatchGetDeveloperProductConfigsResponse,
  type DeveloperProductConfigV2,
} from '@modules/clients/developerProducts';
import passesClient, { type GamePassConfigV2 } from '@modules/clients/passes';

import { catalogClient } from '@modules/clients';

type AvatarItemData = {
  itemId: number;
  name: string;
  price?: number | null;
};

type DeveloperProductData = {
  productId: number;
  name: string;
  defaultPriceInRobux: number | null;
  // To render the thumbnail, we need to temporarily use the iconImageAssetId directly.
  // Thumbnails currently use target IDs instead of product IDs for developer products.
  iconImageAssetId: number | null;
};

type GamePassData = {
  gamePassId: number;
  name: string;
  defaultPriceInRobux: number | null;
};

const mapCatalogArrayToAvatarItems = (res: {
  data?: Array<{ id?: number; name?: string; price?: number }>;
}): AvatarItemData[] => {
  const items = res.data ?? [];
  return items.map((d) => ({ itemId: d.id ?? 0, name: d.name ?? '', price: d.price ?? 0 }));
};

const parseDeveloperProductData = (config: DeveloperProductConfigV2): DeveloperProductData => {
  return {
    productId: config.productId,
    name: config.name,
    defaultPriceInRobux: config.priceInformation?.defaultPriceInRobux ?? null,
    iconImageAssetId: config.iconImageAssetId,
  };
};

const parseGamePassData = (config: GamePassConfigV2): GamePassData => {
  return {
    gamePassId: config.gamePassId,
    name: config.name,
    defaultPriceInRobux: config.priceInformation?.defaultPriceInRobux ?? null,
  };
};

export type ItemMonetizationApiClient = {
  getItemMonetizationDetails: DeveloperAnalyticsAggregationsClientWrapper['getItemMonetizationDetails'];
  getCachedGamePasses: (
    universeId: number,
    gamePassIds: number[],
  ) => Promise<{ data: GamePassData[] }>;
  getCachedDeveloperProducts: (
    universeId: number,
    developerProductIds: number[],
  ) => Promise<{ data: DeveloperProductData[] }>;
  getCachedAssetDetails: (assetIds: number[]) => Promise<{ data: AvatarItemData[] }>;
  getCachedBundleDetails: (bundleIds: number[]) => Promise<{ data: AvatarItemData[] }>;
  getThumbnailImageUrl: (thumbnailType: ThumbnailTypes, itemId: number) => Promise<string>;
};

export const ItemMonetizationClientContext = createContext<ItemMonetizationApiClient>({
  ...developerAnalyticsAggregationsClient,
  getCachedGamePasses: async () => ({ data: [] }),
  getCachedDeveloperProducts: async () => ({ data: [] }),
  getCachedAssetDetails: async () => ({ data: [] }),
  getCachedBundleDetails: async () => ({ data: [] }),
  getThumbnailImageUrl: async () => '',
});
export const useItemMonetizationClient = (): ItemMonetizationApiClient => {
  const client = useContext(ItemMonetizationClientContext);
  if (client === null) {
    throw new Error(
      'useItemMonetizationClient must be used within a ItemMonetizationClientContext',
    );
  }
  return client;
};

function ItemMonetizationClientProvider({ children }: React.PropsWithChildren) {
  const queryClient = useQueryClient();

  const context = useMemo(() => {
    const getPassesByIds = (request: { universeId: number; gamePassIds: number[] }) => {
      return passesClient.batchGetGamePassConfigs(request);
    };
    const getCachedGamePasses = async (universeId: number, gamePassIds: number[]) => {
      // dedupe and sort for a stable key
      const normalizedIds = Array.from(new Set(gamePassIds)).sort((a, b) => a - b);

      if (!universeId || !Number.isFinite(universeId) || normalizedIds.length === 0) {
        return { data: [] };
      }

      const queryKey = ['gamePasses', 'getPassesByIds', universeId, normalizedIds] as const;
      const response = await queryClient.ensureQueryData({
        queryKey,
        queryFn: () =>
          passesClient.batchGetGamePassConfigs({
            universeId,
            gamePassIds: normalizedIds,
          }),
        staleTime: 60_000,
      });
      return { data: response.gamePasses.map(parseGamePassData) };
    };

    const getCachedDeveloperProducts = async (
      universeId: number,
      developerProductIds: number[],
    ) => {
      // dedupe and sort for a stable key
      const normalizedIds = Array.from(new Set(developerProductIds)).sort((a, b) => a - b);

      if (!universeId || !Number.isFinite(universeId) || normalizedIds.length === 0) {
        return { data: [] };
      }

      const queryKey = [
        'developerProducts',
        'getDeveloperProductConfigs',
        universeId,
        normalizedIds,
      ] as const;
      const response = await queryClient.ensureQueryData({
        queryKey,
        queryFn: () =>
          developerProductsClient.batchGetDeveloperProductConfigs({
            universeId,
            productIds: normalizedIds,
          }),
        staleTime: 60_000,
      });

      // We need to populate the query client with the individual product configs
      // otherwise if we try to access individual product configs, it won't hit the cache
      response.developerProducts.forEach((product) => {
        const singleQueryKey = [
          'developerProducts',
          'getDeveloperProductConfigs',
          universeId,
          [product.productId],
        ] as const;
        const singleQueryResult = {
          developerProducts: [product],
        } satisfies BatchGetDeveloperProductConfigsResponse;
        queryClient.setQueryData(singleQueryKey, singleQueryResult);
      });

      return { data: response.developerProducts.map(parseDeveloperProductData) };
    };

    const getCachedAssetDetails = async (assetIds: number[]) => {
      const normalizedIds = Array.from(new Set(assetIds)).sort((a, b) => a - b);
      if (normalizedIds.length === 0) {
        return { data: [] };
      }
      const res = await queryClient.ensureQueryData({
        queryKey: ['catalog', 'getAssetDetails', normalizedIds] as const,
        queryFn: () => catalogClient.postAssetDetails(normalizedIds),
        staleTime: 60_000,
      });
      return { data: mapCatalogArrayToAvatarItems(res) };
    };

    const getCachedBundleDetails = async (bundleIds: number[]) => {
      const normalizedIds = Array.from(new Set(bundleIds)).sort((a, b) => a - b);
      if (normalizedIds.length === 0) {
        return { data: [] };
      }
      const res = await queryClient.ensureQueryData({
        queryKey: ['catalog', 'getAssetDetails', normalizedIds] as const,
        queryFn: () => catalogClient.postBundleDetails(normalizedIds),
        staleTime: 60_000,
      });
      return { data: mapCatalogArrayToAvatarItems(res) };
    };

    const getThumbnailImageUrl = async (
      thumbnailType: ThumbnailTypes,
      itemId: number,
    ): Promise<string> => {
      if (!Number.isFinite(itemId) || itemId <= 0) {
        return '';
      }
      const result = await queryClient.ensureQueryData({
        queryKey: ['thumbnails', thumbnailType, itemId] as const,
        queryFn: async () => {
          try {
            const racedImageUrl = await Promise.race<string | undefined>([
              (async () => {
                const { imageUrl } = await ThumbnailClient.getThumbnailImage(
                  thumbnailType,
                  itemId,
                  ReturnPolicy.PlaceHolder,
                );
                return imageUrl || '';
              })(),
              new Promise<string>((resolve) => setTimeout(() => resolve(''), 500)),
            ]);
            return racedImageUrl || '';
          } catch {
            return '';
          }
        },
        staleTime: 60_000,
      });
      return result;
    };

    return {
      ...developerAnalyticsAggregationsClient,
      getPassesByIds,
      getCachedGamePasses,
      getCachedDeveloperProducts,
      getCachedAssetDetails,
      getCachedBundleDetails,
      getThumbnailImageUrl,
    };
  }, [queryClient]);

  return (
    <ItemMonetizationClientContext.Provider value={context}>
      {children}
    </ItemMonetizationClientContext.Provider>
  );
}
export default ItemMonetizationClientProvider;
