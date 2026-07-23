import type { ListShopItemsResponse } from '@rbx/client-shops-api/v1';
import { useInfiniteCounter } from '@modules/monetization-shared/react-query';
import { API_DEFAULT_PAGE_SIZE } from '../../queries/constants';
import {
  useInfiniteListShopItems,
  type UseInfiniteListShopItemsQueryOptions,
  type UseInfiniteListShopItemsResult,
} from '../../queries/useInfiniteListShopItems';

export type UseCountShopItemsParams = {
  shopId: number | undefined;
  /** Number of items to retrieve per fetch. */
  pageSize?: number;
  /**
   * Extract the count from a single page. Defaults to the length of `items`;
   * pass a filtering counter when measuring eligibility instead of raw count.
   */
  getPageCount?: (page: ListShopItemsResponse) => number;
  /** Optional latch to stop counting early; pre-fetching continues in the background. */
  shouldShortCircuit?: (acc: number) => boolean;
};

const getDefaultPageCount = (page: ListShopItemsResponse) => page.items?.length ?? 0;

/**
 * Running count of shop items in cache for a given shopId. Built on top of the
 * raw infinite list via `useInfiniteCounter`, so it shares the same cache key.
 */
export function useCountShopItems(
  {
    shopId,
    pageSize = API_DEFAULT_PAGE_SIZE,
    getPageCount = getDefaultPageCount,
    shouldShortCircuit,
  }: UseCountShopItemsParams,
  options: UseInfiniteListShopItemsQueryOptions = {},
): UseInfiniteListShopItemsResult<number> {
  const counter = useInfiniteCounter(getPageCount, shouldShortCircuit);
  return useInfiniteListShopItems({ shopId, pageSize }, { ...options, select: counter });
}
