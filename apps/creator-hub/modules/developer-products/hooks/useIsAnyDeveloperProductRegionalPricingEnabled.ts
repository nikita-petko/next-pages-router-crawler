import { useInfiniteLatchSelector } from '@modules/monetization-shared/react-query';
import {
  useInfiniteListDeveloperProducts,
  type UseInfiniteListDeveloperProductsResult,
  type ListDeveloperProductsConfigsResponse,
  type UseInfiniteListDeveloperProductsQueryOptions,
} from '../queries/useInfiniteListDeveloperProducts';
import { DEFAULT_PAGE_LIMIT } from '../queries/constants';
import { hasRegionalPricingEnabled } from '../utils/developerProductUtils';

export type UseIsAnyDeveloperProductRegionalPricingEnabledParams = {
  universeId: number;
  /** Number of products to retrieve per fetch */
  limit?: number;
};

/**
 * Hook to return whether any loaded developer product is regional pricing enabled for a given universe ID.
 * Intended use is to run against query cache only to determine if gifting trading warnings should be shown.
 */
export function useIsAnyDeveloperProductRegionalPricingEnabled(
  { universeId, limit = DEFAULT_PAGE_LIMIT }: UseIsAnyDeveloperProductRegionalPricingEnabledParams,
  options: UseInfiniteListDeveloperProductsQueryOptions = {},
): UseInfiniteListDeveloperProductsResult<boolean> {
  const latchIsAnyDeveloperProductRegionalPricingEnabled = useInfiniteLatchSelector(
    (page: ListDeveloperProductsConfigsResponse) =>
      page.developerProducts?.some(hasRegionalPricingEnabled) ?? false,
  );

  return useInfiniteListDeveloperProducts(
    { universeId, limit },
    { ...options, select: latchIsAnyDeveloperProductRegionalPricingEnabled },
  );
}
