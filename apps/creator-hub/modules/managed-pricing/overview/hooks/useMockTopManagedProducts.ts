import { useMemo } from 'react';
import { useManagedProducts } from '../../manage-items/hooks/useManagedProducts';
import type { ManagedProductWithRevenue } from '../../types';

type UseMockTopManagedProductsParams = {
  universeId: number;
  limit: number;
  /** When false, skips fetching managed products and returns an empty, non-loading result. */
  enabled?: boolean;
};

/** Deterministic Knuth multiplicative hash → revenue roughly in [100, 100_000] Robux. */
export function mockRevenueLast30Days(productId: number): number {
  const hash = ((productId * 2654435761) >>> 0) % 1000;
  return (hash + 1) * 100;
}

/**
 * Mock variant of `useTopManagedProducts` for local development. Returns the
 * universe's managed-pricing-disabled products with deterministic, hash-based
 * mock revenue attached. Sorts by revenue descending and slices to `limit`.
 *
 * When `enabled` is false, the upstream `useManagedProducts` queries stay
 * idle and this hook returns a stable inert result.
 */
export function useMockTopManagedProducts({
  universeId,
  limit,
  enabled = true,
}: UseMockTopManagedProductsParams) {
  const { allProducts, isAllProductsLoaded } = useManagedProducts({ universeId, enabled });

  const data = useMemo<ManagedProductWithRevenue[]>(() => {
    if (!enabled) {
      return [];
    }
    return allProducts
      .filter((product) => !product.isManagedPricingEnabled)
      .map((product) => ({
        ...product,
        revenueLast30Days: mockRevenueLast30Days(product.id),
      }))
      .sort((a, b) => b.revenueLast30Days - a.revenueLast30Days)
      .slice(0, limit);
  }, [allProducts, limit, enabled]);

  return {
    data,
    isLoading: enabled && !isAllProductsLoaded,
    isError: false,
  };
}
