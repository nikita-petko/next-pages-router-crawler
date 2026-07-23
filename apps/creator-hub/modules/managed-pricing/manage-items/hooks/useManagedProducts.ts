import { useCallback, useMemo } from 'react';
import type { GamePassConfigV2 } from '@modules/clients/passes';
import {
  useInfiniteListDeveloperProducts,
  type ListDeveloperProductsConfigsResponse,
} from '@modules/developer-products/queries/useInfiniteListDeveloperProducts';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import { useBackgroundPageLoader } from '@modules/monetization-shared/useBackgroundPageLoader';
import { useListAllPassesForUniverse } from '@modules/passes/queries/useListAllPassesForUniverse';
import { DEFAULT_PAGE_SIZE } from '../../queries/constants';
import type { ManagedProduct } from '../../types';
import { transformDeveloperProducts, transformGamePasses } from '../utils/transformManagedProducts';

type UseManagedProductsParams = {
  universeId: number;
  pageSize?: number;
  /** When false, skips fetching and pagination. Defaults to true. */
  enabled?: boolean;
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
 * and useListAllPassesForUniverse. This hook should generally read from the shared query cache
 * — no duplicate fetches.
 */
export function useManagedProducts({
  universeId,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseManagedProductsParams) {
  const flattenEligibleDeveloperProducts = useInfiniteFlatMap(selectEligibleDeveloperProducts);

  const {
    data: developerProducts = EMPTY_PRODUCTS,
    hasNextPage: hasNextDevProductsPage,
    fetchNextPage,
    isLoading: isDevProductsLoading,
  } = useInfiniteListDeveloperProducts(
    { universeId, pageSize },
    { select: flattenEligibleDeveloperProducts, enabled },
  );

  // TODO: increase pagination limit for game passes
  const { data: gamePasses = EMPTY_PRODUCTS, isLoading: isPassesLoading } =
    useListAllPassesForUniverse(universeId, { select: selectEligibleGamePasses, enabled });

  const isAllProductsLoaded = !hasNextDevProductsPage && !isDevProductsLoading && !isPassesLoading;

  const allProducts = useMemo<ManagedProduct[]>(() => {
    // Default order game passes > developer products
    return [...gamePasses, ...developerProducts];
  }, [gamePasses, developerProducts]);

  const fetchNextDevProductsPage = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  useBackgroundPageLoader({
    hasNextPage: enabled && hasNextDevProductsPage,
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
