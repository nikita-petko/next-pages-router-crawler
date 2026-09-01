import { useMemo, useState } from 'react';
import type { ShopItem, ShopItemsFilters } from '../../types';

type UseShopItemsFiltersParams = {
  items: ShopItem[];
};

export function useShopItemsFilters({ items }: UseShopItemsFiltersParams) {
  const [filters, setFilters] = useState<ShopItemsFilters>({});

  const hasActiveFilter = useMemo(() => {
    const { isVisibleInShop, type, categories } = filters;
    return isVisibleInShop !== undefined || type !== undefined || (categories?.length ?? 0) > 0;
  }, [filters]);

  const filteredItems = useMemo<ShopItem[]>(() => {
    if (!hasActiveFilter) {
      return items;
    }

    const { isVisibleInShop, type, categories } = filters;
    const hasCategoriesFilter = categories !== undefined && categories.length > 0;
    return items.filter((item) => {
      if (isVisibleInShop !== undefined && item.isVisibleInShop !== isVisibleInShop) {
        return false;
      }
      if (type !== undefined && item.type !== type) {
        return false;
      }
      if (hasCategoriesFilter && !categories.includes(item.category.name)) {
        return false;
      }
      return true;
    });
  }, [items, filters, hasActiveFilter]);

  return {
    filters,
    setFilters,
    filteredItems,
    hasActiveFilter,
  } as const;
}
