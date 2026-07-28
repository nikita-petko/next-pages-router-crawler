import { useInfiniteLatchSelector } from '@modules/monetization-shared/react-query';
import { DEFAULT_PAGE_SIZE } from '../queries/constants';
import {
  useInfiniteListDeveloperProducts,
  type UseInfiniteListDeveloperProductsResult,
  type ListDeveloperProductsConfigsResponse,
  type UseInfiniteListDeveloperProductsQueryOptions,
} from '../queries/useInfiniteListDeveloperProducts';
import { hasRegionalPricingEnabled } from '../utils/developerProductUtils';

export type UseIsAnyDeveloperProductRegionalPricingEnabledParams = {
  universeId: number;
  /** Number of products to retrieve per fetch */
  pageSize?: number;
};

/**
 * Hook to return whether any loaded developer product is regional pricing enabled for a given universe ID.
 * Intended use is to run against query cache only to determine if gifting trading warnings should be shown.
 */
export function useIsAnyDeveloperProductRegionalPricingEnabled(
  {
    universeId,
    pageSize = DEFAULT_PAGE_SIZE,
  }: UseIsAnyDeveloperProductRegionalPricingEnabledParams,
  options: UseInfiniteListDeveloperProductsQueryOptions = {},
): UseInfiniteListDeveloperProductsResult<boolean> {
  const latchIsAnyDeveloperProductRegionalPricingEnabled = useInfiniteLatchSelector(
    (page: ListDeveloperProductsConfigsResponse) =>
      page.developerProducts?.some(hasRegionalPricingEnabled) ?? false,
  );

  return useInfiniteListDeveloperProducts(
    { universeId, pageSize },
    { ...options, select: latchIsAnyDeveloperProductRegionalPricingEnabled },
  );
}
