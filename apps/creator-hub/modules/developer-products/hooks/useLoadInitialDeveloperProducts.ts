import { useLoadInitialPages } from '@modules/monetization-shared/react-query';
import { DEFAULT_PAGE_SIZE, INITIAL_FETCH_TOTAL } from '../queries/constants';
import type { UseInfiniteListDeveloperProductsQueryOptions } from '../queries/useInfiniteListDeveloperProducts';
import {
  useCountDeveloperProducts,
  type UseCountDeveloperProductsParams,
} from './useCountDeveloperProducts';

export type UseLoadInitialDeveloperProductsParams = UseCountDeveloperProductsParams & {
  /** Total number of products to initially retrieve */
  initialTotal?: number;
};

/**
 * Hook to preload initial developer products for a given universe ID
 */
export function useLoadInitialDeveloperProducts(
  {
    universeId,
    pageSize = DEFAULT_PAGE_SIZE,
    isArchived,
    initialTotal = INITIAL_FETCH_TOTAL,
    getPageCount,
    shouldShortCircuit,
  }: UseLoadInitialDeveloperProductsParams,
  options: UseInfiniteListDeveloperProductsQueryOptions = {},
) {
  const countResult = useCountDeveloperProducts(
    { universeId, pageSize, isArchived, getPageCount, shouldShortCircuit },
    options,
  );

  return useLoadInitialPages(countResult, initialTotal);
}
