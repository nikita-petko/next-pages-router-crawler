import { useCallback, useMemo } from 'react';
import type { ListShopItemsResponse } from '@rbx/client-shops-api/v1';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import { useBackgroundPageLoader } from '@modules/monetization-shared/useBackgroundPageLoader';
import { API_DEFAULT_PAGE_SIZE } from '../../queries/constants';
import { useInfiniteListShopItems } from '../../queries/useInfiniteListShopItems';
import type { ShopItem } from '../../types';
import { transformShopItems } from '../utils/transformShopItems';

type UseShopItemsParams = {
  shopId: number | undefined;
  pageSize?: number;
  /** Override to suppress fetching (e.g. when the parent shop has not resolved yet). */
  enabled?: boolean;
};

export type UseShopItemsReturn = {
  items: ShopItem[];
  isAllItemsLoaded: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
};

const EMPTY_ITEMS: ShopItem[] = [];

const selectPageItems = (page: ListShopItemsResponse): ShopItem[] => transformShopItems(page.items);

// Flattens paginated API responses into a single `ShopItem[]` and chases
// remaining pages in the background until the cache is fully hydrated.
export function useShopItems({
  shopId,
  pageSize = API_DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseShopItemsParams): UseShopItemsReturn {
  const flattenItems = useInfiniteFlatMap<ListShopItemsResponse, ShopItem>(selectPageItems);

  const {
    data: items = EMPTY_ITEMS,
    hasNextPage,
    fetchNextPage,
    isLoading,
  } = useInfiniteListShopItems(
    { shopId, pageSize },
    { select: flattenItems, enabled: enabled && !!shopId },
  );

  const fetchNextItemsPage = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  useBackgroundPageLoader({
    hasNextPage: enabled && hasNextPage,
    fetchNextPage: fetchNextItemsPage,
  });

  const isAllItemsLoaded = !hasNextPage && !isLoading;

  return useMemo(
    () =>
      ({
        items,
        isAllItemsLoaded,
        hasNextPage,
        fetchNextPage: fetchNextItemsPage,
      }) as const,
    [items, isAllItemsLoaded, hasNextPage, fetchNextItemsPage],
  );
}
