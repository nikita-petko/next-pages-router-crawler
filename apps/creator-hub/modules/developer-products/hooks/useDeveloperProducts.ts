import { useCallback, useMemo } from 'react';
import { useInfiniteFlatMap } from '@modules/monetization-shared/react-query';
import { DEFAULT_PAGE_SIZE } from '../queries/constants';
import {
  useInfiniteListDeveloperProducts,
  type ListDeveloperProductsConfigsResponse,
} from '../queries/useInfiniteListDeveloperProducts';
import type { DeveloperProductConfig } from '../types';
import { parseDeveloperProductConfigs } from '../utils/developerProductUtils';

export type UseDeveloperProductsParams = {
  universeId: number;
  pageSize?: number;
  /** Filter to archived-only (true), active-only (false), or unfiltered (omit). */
  isArchived?: boolean;
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
  pageSize = DEFAULT_PAGE_SIZE,
  isArchived,
}: UseDeveloperProductsParams) {
  const flattenDeveloperProducts = useInfiniteFlatMap(selectDeveloperProducts);

  const {
    data: developerProducts = EMPTY_PRODUCTS,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteListDeveloperProducts(
    { universeId, pageSize, isArchived },
    { select: flattenDeveloperProducts },
  );

  const fetchNextProductsPage = useCallback(() => {
    void fetchNextPage({ cancelRefetch: false, throwOnError: false });
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
