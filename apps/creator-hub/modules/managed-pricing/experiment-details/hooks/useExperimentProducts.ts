import { useCallback, useMemo } from 'react';
import type { ListExperimentProductDetailsResponse } from '@rbx/client-price-experimentation-api/v1';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import { useBackgroundPageLoader } from '@modules/monetization-shared/useBackgroundPageLoader';
import { DEFAULT_PAGE_SIZE } from '../../queries/constants';
import { useInfiniteListExperimentProductDetails } from '../../queries/useInfiniteListExperimentProductDetails';
import type { ExperimentProduct } from '../../types';
import type { UseExperimentProductsReturn } from '../types';
import { transformExperimentResultToExperimentProduct } from '../utils/transformExperimentProducts';

type UseExperimentProductsParams = {
  universeId: number;
  experimentId: string;
  pageSize?: number;
};

const EMPTY_PRODUCTS: ExperimentProduct[] = [];

function selectPageProducts(page: ListExperimentProductDetailsResponse): ExperimentProduct[] {
  return page.products.map(transformExperimentResultToExperimentProduct);
}

/**
 * Data hook for non-upcoming experiments. Wraps `useInfiniteListExperimentProductDetails` and
 * projects the results into the unified `ExperimentProduct` shape, splitting by product type so
 * the table can filter by Developer Products / Game Passes without re-walking the list.
 *
 * Drives a background page loader so the full result set lands in cache without requiring user
 * interaction.
 */
export function useExperimentProducts({
  universeId,
  experimentId,
  pageSize = DEFAULT_PAGE_SIZE,
}: UseExperimentProductsParams): UseExperimentProductsReturn {
  const flattenProducts = useInfiniteFlatMap<
    ListExperimentProductDetailsResponse,
    ExperimentProduct
  >(selectPageProducts);

  const {
    data: products = EMPTY_PRODUCTS,
    hasNextPage,
    fetchNextPage,
    isLoading,
  } = useInfiniteListExperimentProductDetails(
    { universeId, experimentId, pageSize },
    { select: flattenProducts },
  );

  const developerProducts = useMemo(
    () => products.filter((p) => p.type === 'DeveloperProduct'),
    [products],
  );

  const gamePasses = useMemo(() => products.filter((p) => p.type === 'GamePass'), [products]);

  const fetchNextProductsPage = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  useBackgroundPageLoader({
    hasNextPage,
    fetchNextPage: fetchNextProductsPage,
  });

  const isAllProductsLoaded = !hasNextPage && !isLoading;

  return {
    products,
    developerProducts,
    gamePasses,
    isAllProductsLoaded,
    hasNextPage,
    fetchNextPage: fetchNextProductsPage,
  } as const;
}
