import { useInfiniteLatchSelector } from '@modules/monetization-shared/react-query';
import { DEFAULT_PAGE_SIZE } from '../queries/constants';
import {
  useInfiniteListDeveloperProducts,
  type UseInfiniteListDeveloperProductsResult,
  type ListDeveloperProductsConfigsResponse,
  type UseInfiniteListDeveloperProductsQueryOptions,
} from '../queries/useInfiniteListDeveloperProducts';
import { hasManagedPricingEnabled } from '../utils/developerProductUtils';

export type UseIsAnyDeveloperProductManagedPricingEnabledParams = {
  universeId: number;
  /** Number of products to retrieve per fetch */
  pageSize?: number;
};

/**
 * Hook to return whether any loaded developer product is managed pricing enabled for a given universe ID.
 * Intended use is to run against query cache only to determine if gifting trading warnings should be shown.
 */
export function useIsAnyDeveloperProductManagedPricingEnabled(
  { universeId, pageSize = DEFAULT_PAGE_SIZE }: UseIsAnyDeveloperProductManagedPricingEnabledParams,
  options: UseInfiniteListDeveloperProductsQueryOptions = {},
): UseInfiniteListDeveloperProductsResult<boolean> {
  const latchIsAnyDeveloperProductManagedPricingEnabled = useInfiniteLatchSelector(
    (page: ListDeveloperProductsConfigsResponse) =>
      page.developerProducts?.some(hasManagedPricingEnabled) ?? false,
  );

  return useInfiniteListDeveloperProducts(
    { universeId, pageSize },
    { ...options, select: latchIsAnyDeveloperProductManagedPricingEnabled },
  );
}
