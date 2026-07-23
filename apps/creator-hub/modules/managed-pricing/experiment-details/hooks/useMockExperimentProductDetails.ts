import { useMemo } from 'react';
import { useManagedProducts } from '../../manage-items/hooks/useManagedProducts';
import type { ManagedProduct } from '../../manage-items/types';
import type { ExperimentProduct } from '../types';

type ExperimentStatus = 'upcoming' | 'completed';

export type UseExperimentProductDetailsParams = {
  universeId: number;
  status: ExperimentStatus;
  limit?: number;
};

/**
 * Deterministic mock: generates a varied but repeatable optimized price
 * from the product id, then derives the optimization percentage from the
 * actual price difference.
 */
function mockOptimizedPrice(
  product: ManagedProduct,
): Required<Pick<ExperimentProduct, 'optimizedPriceInRobux' | 'optimizationPercentage'>> {
  // Knuth multiplicative hash → multiplier roughly in [0.70, 1.30]
  // eslint-disable-next-line no-bitwise -- just testing this for now.
  const hash = ((product.id * 2654435761) >>> 0) % 61;
  const multiplier = 0.7 + hash / 100; // 0.70 – 1.30
  const optimizedPrice = Math.max(1, Math.round(product.defaultPriceInRobux * multiplier));

  const optimizationPercentage =
    product.defaultPriceInRobux === 0
      ? 0
      : Math.round(
          ((optimizedPrice - product.defaultPriceInRobux) / product.defaultPriceInRobux) * 1000,
        ) / 10;

  return {
    optimizedPriceInRobux: optimizedPrice,
    optimizationPercentage,
  };
}

function toExperimentProducts(
  products: ManagedProduct[],
  status: ExperimentStatus,
): ExperimentProduct[] {
  if (status === 'upcoming') {
    return products.filter((p) => p.isManagedPricingEnabled);
  }

  return products.map((product) => ({
    ...product,
    ...mockOptimizedPrice(product),
  }));
}

/**
 * Wraps `useManagedProducts` with experiment-status-aware filtering and mock data.
 *
 * - **upcoming**: only includes products where `isManagedPricingEnabled` is true.
 *   No optimization / optimized price data.
 * - **completed**: includes all products, augmented with deterministic mock
 *   `optimizedPriceInRobux` and `optimizationPercentage`.
 */
export function useExperimentProductDetails({
  universeId,
  status,
  limit,
}: UseExperimentProductDetailsParams) {
  const {
    allProducts,
    developerProducts,
    gamePasses,
    isAllProductsLoaded,
    hasNextDevProductsPage,
    fetchNextDevProductsPage,
  } = useManagedProducts({ universeId, limit });

  const products = useMemo(() => toExperimentProducts(allProducts, status), [allProducts, status]);

  const experimentDevProducts = useMemo(
    () => toExperimentProducts(developerProducts, status),
    [developerProducts, status],
  );

  const experimentGamePasses = useMemo(
    () => toExperimentProducts(gamePasses, status),
    [gamePasses, status],
  );

  return {
    products,
    developerProducts: experimentDevProducts,
    gamePasses: experimentGamePasses,
    isAllProductsLoaded,
    hasNextDevProductsPage,
    fetchNextDevProductsPage,
  } as const;
}
