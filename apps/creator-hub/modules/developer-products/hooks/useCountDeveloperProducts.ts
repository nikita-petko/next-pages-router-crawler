import { useInfiniteCounter } from '@modules/monetization-shared/react-query';
import { DEFAULT_PAGE_SIZE } from '../queries/constants';
import {
  useInfiniteListDeveloperProducts,
  type UseInfiniteListDeveloperProductsQueryOptions,
  type UseInfiniteListDeveloperProductsResult,
  type ListDeveloperProductsConfigsResponse,
} from '../queries/useInfiniteListDeveloperProducts';

export type UseCountDeveloperProductsParams = {
  universeId: number;
  /** Number of products to retrieve per fetch */
  pageSize?: number;
  /** Filter by archived status. Omit for no filter, true for archived only, false for active only. */
  isArchived?: boolean;
  /** A function to extract the count from a single page. Default collects count of all products - use for filtering */
  getPageCount?: (page: ListDeveloperProductsConfigsResponse) => number;
  /** Optional function to break the counter early if a condition is met. This will still continue to load in the background. */
  shouldShortCircuit?: (acc: number) => boolean;
};

const getDefaultPageCount = (page: ListDeveloperProductsConfigsResponse) =>
  page.developerProducts?.length ?? 0;

/**
 * Hook to return current total of dev products in cache for a given universe ID
 */
export function useCountDeveloperProducts(
  {
    universeId,
    pageSize = DEFAULT_PAGE_SIZE,
    isArchived,
    getPageCount = getDefaultPageCount,
    shouldShortCircuit,
  }: UseCountDeveloperProductsParams,
  options: UseInfiniteListDeveloperProductsQueryOptions = {},
): UseInfiniteListDeveloperProductsResult<number> {
  const countTotalDeveloperProducts = useInfiniteCounter(getPageCount, shouldShortCircuit);

  return useInfiniteListDeveloperProducts(
    { universeId, pageSize, isArchived },
    { ...options, select: countTotalDeveloperProducts },
  );
}
