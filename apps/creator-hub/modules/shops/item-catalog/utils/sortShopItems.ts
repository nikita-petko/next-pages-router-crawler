import type { ShopItem, SortOrder, SortableShopItemColumn } from '../../types';

type CompareFn = (a: ShopItem, b: ShopItem) => number;

const compareByName: CompareFn = (a, b) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
const compareByType: CompareFn = (a, b) => a.type.localeCompare(b.type);
const compareByVisibility: CompareFn = (a, b) =>
  Number(b.isVisibleInShop) - Number(a.isVisibleInShop);
const compareByCategory: CompareFn = (a, b) =>
  a.category.name.localeCompare(b.category.name, undefined, { sensitivity: 'base' });

const comparators = {
  name: compareByName,
  type: compareByType,
  isVisibleInShop: compareByVisibility,
  category: compareByCategory,
} as const satisfies Record<SortableShopItemColumn, CompareFn>;

export function sortShopItems(
  items: ShopItem[],
  column: SortableShopItemColumn | undefined,
  order: SortOrder,
): ShopItem[] {
  if (order === 'default' || column === undefined) {
    return items;
  }

  const sorted = [...items].sort(comparators[column]);
  return order === 'desc' ? sorted.toReversed() : sorted;
}
