import type { ListExperimentProductDetailsResponse } from '@rbx/client-price-experimentation-api/v1';
import { useInfiniteCounter } from '@modules/monetization-shared/react-query';
import { DEFAULT_PAGE_SIZE } from '../../queries/constants';
import {
  useInfiniteListExperimentProductDetails,
  type UseInfiniteListExperimentProductDetailsQueryOptions,
  type UseInfiniteListExperimentProductDetailsResult,
} from '../../queries/useInfiniteListExperimentProductDetails';

export type UseCountExperimentProductDetailsParams = {
  universeId: number;
  experimentId: string;
  /** Number of products to retrieve per fetch */
  pageSize?: number;
  /** A function to extract the count from a single page. Default collects count of all products - use for filtering */
  getPageCount?: (page: ListExperimentProductDetailsResponse) => number;
  /** Optional function to break the counter early if a condition is met. This will still continue to load in the background. */
  shouldShortCircuit?: (acc: number) => boolean;
};

const getDefaultPageCount = (page: ListExperimentProductDetailsResponse) =>
  page.products?.length ?? 0;

/**
 * Hook to return current total of experiment product details in cache for a given universe ID and experiment ID.
 */
export function useCountExperimentProductDetails(
  {
    universeId,
    experimentId,
    pageSize = DEFAULT_PAGE_SIZE,
    getPageCount = getDefaultPageCount,
    shouldShortCircuit,
  }: UseCountExperimentProductDetailsParams,
  options: UseInfiniteListExperimentProductDetailsQueryOptions = {},
): UseInfiniteListExperimentProductDetailsResult<number> {
  const countTotalProducts = useInfiniteCounter(getPageCount, shouldShortCircuit);

  return useInfiniteListExperimentProductDetails(
    { universeId, experimentId, pageSize },
    { ...options, select: countTotalProducts },
  );
}
