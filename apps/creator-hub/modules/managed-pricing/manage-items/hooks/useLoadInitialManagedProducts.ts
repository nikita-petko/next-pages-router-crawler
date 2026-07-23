import type { GamePassConfigV2 } from '@modules/clients/passes';
import { useLoadInitialDeveloperProducts } from '@modules/developer-products/hooks/useLoadInitialDeveloperProducts';
import type { ListDeveloperProductsConfigsResponse } from '@modules/developer-products/queries/useInfiniteListDeveloperProducts';
import { useListAllPassesForUniverse } from '@modules/passes/queries/useListAllPassesForUniverse';
import { INITIAL_FETCH_TOTAL, DEFAULT_PAGE_SIZE } from '../../queries/constants';
import { isEligibleForManagedPricing } from '../utils/transformManagedProducts';

type UseLoadInitialManagedProductsParams = {
  universeId: number;
  initialTotal?: number;
  pageSize?: number;
};

const hasAnyEligiblePasses = (passes: GamePassConfigV2[]) =>
  passes.some((p) => isEligibleForManagedPricing(p));

const getEligibleProductCount = (page: ListDeveloperProductsConfigsResponse) =>
  page.developerProducts.reduce((acc, p) => acc + (isEligibleForManagedPricing(p) ? 1 : 0), 0);

/**
 * Hook to load initial managed products for a given universe ID.
 * Should be loaded at the container level.
 *
 * Note: loading all game passes is a temporary measure - longer term we want to incorporate
 * a filter in the API to get only onsale passes, which there are a finite amount of.
 */
export function useLoadInitialManagedProducts({
  universeId,
  initialTotal = INITIAL_FETCH_TOTAL,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseLoadInitialManagedProductsParams) {
  const {
    isEmpty: isDevProductsEmpty,
    isInitialLoading: isDevProductsLoading,
    isInitialError: isDevProductsError,
  } = useLoadInitialDeveloperProducts({
    universeId,
    initialTotal,
    pageSize,
    getPageCount: getEligibleProductCount,
    shouldShortCircuit: (acc) => acc >= initialTotal,
  });

  // Note: the difference between this and dev products is that we upfront load all passes.
  // Loading initial dev products uses an infinite query, so we check a different condition for
  // short-circuiting.
  const {
    data: hasEligiblePasses,
    isLoading: isPassesLoading,
    isError: isPassesError,
  } = useListAllPassesForUniverse(universeId, { select: hasAnyEligiblePasses });

  const isEmpty = isDevProductsEmpty && !hasEligiblePasses;
  const isLoading = isDevProductsLoading || isPassesLoading;
  const isError = isDevProductsError || isPassesError;

  return { isEmpty, isLoading, isError } as const;
}
