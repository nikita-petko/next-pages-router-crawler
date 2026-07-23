import { useCallback, useMemo } from 'react';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import {
  useInfiniteListDeveloperProducts,
  type ListDeveloperProductsConfigsResponse,
} from '../queries/useInfiniteListDeveloperProducts';
import { DEFAULT_PAGE_LIMIT } from '../queries/constants';
import { parseDeveloperProductConfigs } from '../utils/developerProductUtils';
import type { DeveloperProductConfig } from '../types';

export type UseDeveloperProductsParams = {
  universeId: number;
  limit?: number;
};

/** Stable empty array to avoid referential instability on re-renders */
const EMPTY_PRODUCTS: DeveloperProductConfig[] = [];

const selectDeveloperProducts = (
  page: ListDeveloperProductsConfigsResponse,
): DeveloperProductConfig[] => parseDeveloperProductConfigs(page.developerProducts);

/**
 * Data access hook for developer products. Return a single
 * flattened array of all loaded developer products.
 */
export function useDeveloperProducts({
  universeId,
  limit = DEFAULT_PAGE_LIMIT,
}: UseDeveloperProductsParams) {
  const flattenDeveloperProducts = useInfiniteFlatMap(selectDeveloperProducts);

  const {
    data: developerProducts = EMPTY_PRODUCTS,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteListDeveloperProducts({ universeId, limit }, { select: flattenDeveloperProducts });

  const fetchNextProductsPage = useCallback(() => {
    fetchNextPage({ cancelRefetch: false, throwOnError: false });
  }, [fetchNextPage]);

  return useMemo(
    () =>
      ({
        developerProducts,
        isLoading,
        hasNextPage,
        fetchNextPage: fetchNextProductsPage,
      }) as const,
    [developerProducts, isLoading, hasNextPage, fetchNextProductsPage],
  );
}
