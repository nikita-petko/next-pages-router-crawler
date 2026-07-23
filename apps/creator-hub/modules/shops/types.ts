/* istanbul ignore file */
import type { Category, ItemIdentifier, ProductType } from '@rbx/client-shops-api/v1';

export const PERSONALIZED_SHOPS_TABS = ['overview', 'item-catalog'] as const;
export type PersonalizedShopsTab = (typeof PERSONALIZED_SHOPS_TABS)[number];

// -------------------------------------------------------------------------------------------------
// Item catalog
// -------------------------------------------------------------------------------------------------

export type ShopItem = {
  id: string;
  name: string;
  thumbnailAssetId: number;
  type: ProductType;
  /** Mirrors `ShopItem.isVisibleInShop` from shops-api; true = listed, false = hidden. */
  isVisibleInShop: boolean;
  // Kept as the API object so `category.id` is available for future BatchUpdateShopItems.
  category: Category;
};

export function isVisibilityEditable(item: ShopItem): boolean {
  return item.type !== 'GamePass';
}

// A GamePass and a DeveloperProduct can share a numeric id. Compose with `type`
// so anything keying off the item stays unique across the catalog.
export function getShopItemKey(item: ShopItem): string {
  return `${item.type}-${item.id}`;
}

// Inverse of `getShopItemKey`. Splits on the first hyphen: `ProductType` values
// never contain one, so anything after it is the id. Switch (over a ternary) so
// new ProductTypes are easy to add as the shop catalog grows beyond
// GamePass/DeveloperProduct.
export function parseShopItemKey(key: string): ItemIdentifier | undefined {
  const separatorIndex = key.indexOf('-');
  const id = key.slice(separatorIndex + 1);
  switch (key.slice(0, separatorIndex)) {
    case 'GamePass':
      return { type: 'GamePass', id };
    case 'DeveloperProduct':
      return { type: 'DeveloperProduct', id };
    default:
      return undefined;
  }
}

export const SORTABLE_SHOP_ITEM_COLUMNS = ['name', 'type', 'isVisibleInShop', 'category'] as const;
export type SortableShopItemColumn = (typeof SORTABLE_SHOP_ITEM_COLUMNS)[number];

export type ShopItemsFilters = {
  isVisibleInShop?: boolean;
  type?: ProductType;
  categories?: string[];
};

export type { SortOrder } from '@modules/monetization-shared/table-sort/types';
