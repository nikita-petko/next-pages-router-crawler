import { useLoadInitialPages } from '@modules/monetization-shared/react-query';
import { DEFAULT_PAGE_SIZE, INITIAL_FETCH_TOTAL } from '../../queries/constants';
import type { UseInfiniteListExperimentProductDetailsQueryOptions } from '../../queries/useInfiniteListExperimentProductDetails';
import {
  useCountExperimentProductDetails,
  type UseCountExperimentProductDetailsParams,
} from './useCountExperimentProductDetails';

export type UseLoadInitialExperimentProductDetailsParams =
  UseCountExperimentProductDetailsParams & {
    /** Total number of products to initially retrieve */
    initialTotal?: number;
  };

/**
 * Hook to preload initial experiment product details for a given universe and experiment ID.
 */
export function useLoadInitialExperimentProductDetails(
  {
    universeId,
    experimentId,
    pageSize = DEFAULT_PAGE_SIZE,
    initialTotal = INITIAL_FETCH_TOTAL,
    getPageCount,
    shouldShortCircuit,
  }: UseLoadInitialExperimentProductDetailsParams,
  options: UseInfiniteListExperimentProductDetailsQueryOptions = {},
) {
  const countResult = useCountExperimentProductDetails(
    { universeId, experimentId, pageSize, getPageCount, shouldShortCircuit },
    options,
  );

  return useLoadInitialPages(countResult, initialTotal);
}
