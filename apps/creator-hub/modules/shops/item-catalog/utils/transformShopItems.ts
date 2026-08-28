import type { ShopItem as ApiShopItem } from '@rbx/client-shops-api/v1';
import type { ShopItem } from '../../types';

export function transformShopItem(apiItem: ApiShopItem): ShopItem {
  return {
    id: apiItem.item.id,
    name: apiItem.name,
    type: apiItem.item.type,
    isVisibleInShop: apiItem.isVisibleInShop,
    // shops-api has no `isExternallyEligible` yet. Fail open so real items keep
    // surfacing; swap to `apiItem.isExternallyEligible` after the client bump.
    isExternallyEligible: true,
    category: apiItem.category,
    thumbnailAssetId: apiItem.imageAssetId,
  };
}

export function transformShopItems(apiItems: ApiShopItem[]): ShopItem[] {
  return apiItems.map(transformShopItem);
}
