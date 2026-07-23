import { useCallback, useMemo } from 'react';
import {
  useInfiniteListDeveloperProducts,
  type ListDeveloperProductsConfigsResponse,
} from '@modules/developer-products/queries/useInfiniteListDeveloperProducts';
import { useGetAllPassesForUniverse } from '@modules/passes/queries/useGetAllPassesForUniverse';
import type { GamePassConfigV2 } from '@modules/clients/passes';
import { useBackgroundPageLoader } from '@modules/monetization-shared/useBackgroundPageLoader';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import type { ManagedProduct } from '../types';
import { transformDeveloperProducts, transformGamePasses } from '../utils/transformManagedProducts';
import { DEFAULT_PAGE_LIMIT } from './constants';

type UseManagedProductsParams = {
  universeId: number;
  limit?: number;
};

/** Stable empty array to avoid referential instability on re-renders */
const EMPTY_PRODUCTS: ManagedProduct[] = [];

function selectEligibleGamePasses(passes: GamePassConfigV2[]) {
  return transformGamePasses(passes);
}

function selectEligibleDeveloperProducts(page: ListDeveloperProductsConfigsResponse) {
  return transformDeveloperProducts(page.developerProducts);
}

/**
 * Data access hook for managed products. Retrieves eligible developer products and game passes
 * that are eligible for managed pricing.
 *
 * Assumes initial loading is handled by the container via useLoadInitialDeveloperProducts
 * and useGetAllPassesForUniverse. This hook should generally read from the shared query cache
 * — no duplicate fetches.
 */
export function useManagedProducts({
  universeId,
  limit = DEFAULT_PAGE_LIMIT,
}: UseManagedProductsParams) {
  const flattenEligibleDeveloperProducts = useInfiniteFlatMap(selectEligibleDeveloperProducts);

  const {
    data: developerProducts = EMPTY_PRODUCTS,
    hasNextPage: hasNextDevProductsPage,
    fetchNextPage,
    isLoading: isDevProductsLoading,
  } = useInfiniteListDeveloperProducts(
    { universeId, limit },
    { select: flattenEligibleDeveloperProducts },
  );

  // TODO: increase pagination limit for game passes
  const { data: gamePasses = EMPTY_PRODUCTS, isLoading: isPassesLoading } =
    useGetAllPassesForUniverse(universeId, { select: selectEligibleGamePasses });

  const isAllProductsLoaded = !hasNextDevProductsPage && !isDevProductsLoading && !isPassesLoading;

  const allProducts = useMemo<ManagedProduct[]>(() => {
    // Default order game passes > developer products
    return [...gamePasses, ...developerProducts];
  }, [gamePasses, developerProducts]);

  const fetchNextDevProductsPage = useCallback(() => {
    fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  useBackgroundPageLoader({
    hasNextPage: hasNextDevProductsPage,
    fetchNextPage: fetchNextDevProductsPage,
  });

  const totalCount = developerProducts.length + gamePasses.length;

  return useMemo(
    () =>
      ({
        allProducts,
        developerProducts,
        gamePasses,
        isAllProductsLoaded,
        totalCount,
        hasNextDevProductsPage,
        fetchNextDevProductsPage,
      }) as const,
    [
      allProducts,
      developerProducts,
      gamePasses,
      isAllProductsLoaded,
      totalCount,
      hasNextDevProductsPage,
      fetchNextDevProductsPage,
    ],
  );
}

export default useManagedProducts;
