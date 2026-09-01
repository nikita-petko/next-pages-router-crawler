import { useLoadInitialPages } from '@modules/monetization-shared/react-query';
import { API_DEFAULT_PAGE_SIZE, INITIAL_FETCH_TOTAL } from '../../queries/constants';
import type { UseInfiniteListShopItemsQueryOptions } from '../../queries/useInfiniteListShopItems';
import { useCountShopItems, type UseCountShopItemsParams } from './useCountShopItems';

export type UseLoadInitialShopItemsParams = UseCountShopItemsParams & {
  /** Total number of items to initially retrieve. Defaults to `INITIAL_FETCH_TOTAL`. */
  initialTotal?: number;
};

// Container-level prefetch; the table later reads the same cache via useShopItems.
export function useLoadInitialShopItems(
  {
    shopId,
    pageSize = API_DEFAULT_PAGE_SIZE,
    initialTotal = INITIAL_FETCH_TOTAL,
    getPageCount,
    shouldShortCircuit,
  }: UseLoadInitialShopItemsParams,
  options: UseInfiniteListShopItemsQueryOptions = {},
) {
  const countResult = useCountShopItems(
    { shopId, pageSize, getPageCount, shouldShortCircuit },
    options,
  );
  return useLoadInitialPages(countResult, initialTotal);
}
