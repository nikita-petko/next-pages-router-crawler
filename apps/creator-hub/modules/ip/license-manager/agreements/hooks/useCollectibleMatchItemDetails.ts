import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RobloxCatalogApiCatalogSearchDetailedResponseItemV2 } from '@rbx/client-catalog/v1';
import { ItemTargetType } from '@rbx/client-marketplace-items-api/v1';
import catalogClient from '@modules/clients/catalog';
import marketplaceItemsClient, {
  type CollectibleItemDetail,
} from '@modules/clients/marketplaceitems';

const COLLECTIBLE_MATCH_ITEM_DETAILS_QUERY_KEY = ['collectibleMatchItemDetails'];
const COLLECTIBLE_MATCH_ITEM_DETAILS_STALE_TIME_MS = 5 * 60 * 1000;
const COLLECTIBLE_MATCH_ITEM_DETAIL_QUERY_KEY = (collectibleItemId: string) => [
  ...COLLECTIBLE_MATCH_ITEM_DETAILS_QUERY_KEY,
  'item',
  collectibleItemId,
];

const assetSubtypeById: Readonly<Record<number, string>> = {
  2: 'TShirt',
  8: 'Hat',
  11: 'Shirt',
  12: 'Pants',
  41: 'HairAccessory',
  42: 'FaceAccessory',
  43: 'NeckAccessory',
  44: 'ShoulderAccessory',
  45: 'FrontAccessory',
  46: 'BackAccessory',
  47: 'WaistAccessory',
  61: 'EmoteAnimation',
  64: 'TShirtAccessory',
  65: 'ShirtAccessory',
  66: 'PantsAccessory',
  67: 'JacketAccessory',
  68: 'SweaterAccessory',
  69: 'ShortsAccessory',
  72: 'DressSkirtAccessory',
  76: 'EyebrowAccessory',
  77: 'EyelashAccessory',
  88: 'FaceMakeup',
  89: 'LipMakeup',
  90: 'EyeMakeup',
};

const bundleSubtypeById: Readonly<Record<number, string>> = {
  1: 'Body',
  2: 'DynamicHead',
  3: 'Shoes',
  4: 'AvatarAnimations',
};

export interface CollectibleMatchItemDetails {
  collectible: CollectibleItemDetail;
  catalogItem?: RobloxCatalogApiCatalogSearchDetailedResponseItemV2;
  subtype?: string;
}

export type CollectibleMatchItemDetailsById = Record<string, CollectibleMatchItemDetails>;

const getCollectibleMatchItemDetails = async (
  collectibleItemIds: string[],
): Promise<CollectibleMatchItemDetailsById> => {
  const collectibles = await marketplaceItemsClient.getCollectibleItemsDetails(collectibleItemIds);

  const assetIds: number[] = [];
  const bundleIds: number[] = [];
  collectibles.forEach((collectible) => {
    if (collectible.itemTargetId == null) {
      return;
    }
    if (collectible.itemTargetType === ItemTargetType.NUMBER_1) {
      assetIds.push(collectible.itemTargetId);
    } else if (collectible.itemTargetType === ItemTargetType.NUMBER_2) {
      bundleIds.push(collectible.itemTargetId);
    }
  });

  const [assetDetailsResponse, bundleDetailsResponse] = await Promise.all([
    assetIds.length > 0
      ? catalogClient.postAssetDetails(assetIds).catch(() => undefined)
      : undefined,
    bundleIds.length > 0
      ? catalogClient.postBundleDetails(bundleIds).catch(() => undefined)
      : undefined,
  ]);

  const catalogItemByTargetId = new Map<
    number,
    RobloxCatalogApiCatalogSearchDetailedResponseItemV2
  >();
  const subtypeByTargetId = new Map<number, string>();
  assetDetailsResponse?.data?.forEach((asset) => {
    if (asset.id == null) {
      return;
    }
    catalogItemByTargetId.set(asset.id, asset);
    const subtype = asset.assetType == null ? undefined : assetSubtypeById[asset.assetType];
    if (subtype) {
      subtypeByTargetId.set(asset.id, subtype);
    }
  });
  bundleDetailsResponse?.data?.forEach((bundle) => {
    if (bundle.id == null) {
      return;
    }
    catalogItemByTargetId.set(bundle.id, bundle);
    const subtype = bundle.bundleType == null ? undefined : bundleSubtypeById[bundle.bundleType];
    if (subtype) {
      subtypeByTargetId.set(bundle.id, subtype);
    }
  });

  return Object.fromEntries(
    collectibles.flatMap((collectible) => {
      if (!collectible.collectibleItemId) {
        return [];
      }
      const catalogItem =
        collectible.itemTargetId == null
          ? undefined
          : catalogItemByTargetId.get(collectible.itemTargetId);
      return [
        [
          collectible.collectibleItemId,
          {
            collectible,
            ...(catalogItem ? { catalogItem } : {}),
            subtype:
              collectible.itemTargetId == null
                ? undefined
                : subtypeByTargetId.get(collectible.itemTargetId),
          },
        ],
      ];
    }),
  );
};

const useCollectibleMatchItemDetails = (collectibleItemIds: string[]) => {
  const queryClient = useQueryClient();
  const normalizedCollectibleItemIds = useMemo(
    () => [...new Set(collectibleItemIds)].sort(),
    [collectibleItemIds],
  );

  const getCachedDetails = () => {
    if (normalizedCollectibleItemIds.length === 0) {
      return undefined;
    }
    const entries = normalizedCollectibleItemIds.flatMap((collectibleItemId) => {
      const details = queryClient.getQueryData<CollectibleMatchItemDetails>(
        COLLECTIBLE_MATCH_ITEM_DETAIL_QUERY_KEY(collectibleItemId),
      );
      return details ? [[collectibleItemId, details] as const] : [];
    });
    if (entries.length !== normalizedCollectibleItemIds.length) {
      return undefined;
    }

    const oldestDataUpdatedAt = Math.min(
      ...normalizedCollectibleItemIds.map(
        (collectibleItemId) =>
          queryClient.getQueryState(COLLECTIBLE_MATCH_ITEM_DETAIL_QUERY_KEY(collectibleItemId))
            ?.dataUpdatedAt ?? 0,
      ),
    );
    return {
      data: Object.fromEntries(entries),
      dataUpdatedAt: oldestDataUpdatedAt,
    };
  };

  return useQuery({
    queryKey: [...COLLECTIBLE_MATCH_ITEM_DETAILS_QUERY_KEY, 'batch', normalizedCollectibleItemIds],
    queryFn: async () => {
      const now = Date.now();
      const cachedDetails: Record<string, CollectibleMatchItemDetails> = {};
      const collectibleItemIdsToFetch = normalizedCollectibleItemIds.filter((collectibleItemId) => {
        const state = queryClient.getQueryState<CollectibleMatchItemDetails>(
          COLLECTIBLE_MATCH_ITEM_DETAIL_QUERY_KEY(collectibleItemId),
        );
        if (
          state?.data != null &&
          now - state.dataUpdatedAt < COLLECTIBLE_MATCH_ITEM_DETAILS_STALE_TIME_MS
        ) {
          cachedDetails[collectibleItemId] = state.data;
          return false;
        }
        return true;
      });
      const fetchedDetails =
        collectibleItemIdsToFetch.length > 0
          ? await getCollectibleMatchItemDetails(collectibleItemIdsToFetch)
          : {};
      const fetchedAt = Date.now();

      collectibleItemIdsToFetch.forEach((collectibleItemId) => {
        const details = fetchedDetails[collectibleItemId];
        const queryKey = COLLECTIBLE_MATCH_ITEM_DETAIL_QUERY_KEY(collectibleItemId);
        if (details) {
          queryClient.setQueryData(queryKey, details, { updatedAt: fetchedAt });
        } else {
          queryClient.removeQueries({ queryKey, exact: true });
        }
      });

      return {
        ...cachedDetails,
        ...fetchedDetails,
      };
    },
    enabled: normalizedCollectibleItemIds.length > 0,
    staleTime: COLLECTIBLE_MATCH_ITEM_DETAILS_STALE_TIME_MS,
    initialData: () => getCachedDetails()?.data,
    initialDataUpdatedAt: () => getCachedDetails()?.dataUpdatedAt,
  });
};

export default useCollectibleMatchItemDetails;
