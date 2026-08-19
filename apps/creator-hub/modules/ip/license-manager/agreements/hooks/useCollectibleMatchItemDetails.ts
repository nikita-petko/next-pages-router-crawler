import { useQuery } from '@tanstack/react-query';
import { ItemTargetType } from '@rbx/client-marketplace-items-api/v1';
import catalogClient from '@modules/clients/catalog';
import marketplaceItemsClient, {
  type CollectibleItemDetail,
} from '@modules/clients/marketplaceitems';

const COLLECTIBLE_MATCH_ITEM_DETAILS_QUERY_KEY = ['collectibleMatchItemDetails'];

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

  const subtypeByTargetId = new Map<number, string>();
  assetDetailsResponse?.data?.forEach((asset) => {
    if (asset.id == null || asset.assetType == null) {
      return;
    }
    const subtype = assetSubtypeById[asset.assetType];
    if (subtype) {
      subtypeByTargetId.set(asset.id, subtype);
    }
  });
  bundleDetailsResponse?.data?.forEach((bundle) => {
    if (bundle.id == null || bundle.bundleType == null) {
      return;
    }
    const subtype = bundleSubtypeById[bundle.bundleType];
    if (subtype) {
      subtypeByTargetId.set(bundle.id, subtype);
    }
  });

  return Object.fromEntries(
    collectibles.flatMap((collectible) => {
      if (!collectible.collectibleItemId) {
        return [];
      }
      return [
        [
          collectible.collectibleItemId,
          {
            collectible,
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

const useCollectibleMatchItemDetails = (collectibleItemIds: string[]) =>
  useQuery({
    queryKey: [...COLLECTIBLE_MATCH_ITEM_DETAILS_QUERY_KEY, collectibleItemIds],
    queryFn: () => getCollectibleMatchItemDetails(collectibleItemIds),
    enabled: collectibleItemIds.length > 0,
  });

export default useCollectibleMatchItemDetails;
