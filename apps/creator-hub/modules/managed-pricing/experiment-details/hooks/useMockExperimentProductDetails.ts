import { useMemo } from 'react';
import { useManagedProducts } from '../../manage-items/hooks/useManagedProducts';
import type { ManagedPricingEvent, ExperimentProduct, ManagedProduct } from '../../types';
import { transformManagedProductToExperimentProduct } from '../utils/transformExperimentProducts';

type ExperimentStatus = ManagedPricingEvent['status'];

type UseExperimentProductDetailsParams = {
  universeId: number;
  experimentId: string;
  status: ExperimentStatus;
  pageSize?: number;
};

/**
 * Deterministic mock: generates a varied but repeatable optimized price
 * from the product id, then derives the optimization percentage from the
 * actual price difference.
 */
export function mockOptimizedPrice(
  product: ManagedProduct,
): Required<Pick<ExperimentProduct, 'optimizedPriceInRobux' | 'optimizationPercentage'>> {
  // Knuth multiplicative hash → multiplier roughly in [0.70, 1.30]
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
  if (status === 'Upcoming') {
    return products
      .filter((p) => p.isManagedPricingEnabled)
      .map(transformManagedProductToExperimentProduct);
  }

  if (status === 'Completed') {
    return products.map((product) => ({
      ...transformManagedProductToExperimentProduct(product),
      ...mockOptimizedPrice(product),
    }));
  }

  return products.map(transformManagedProductToExperimentProduct);
}

/**
 * Wraps `useManagedProducts` with experiment-status-aware filtering and mock data.
 *
 * - **upcoming**: only includes products where `isManagedPricingEnabled` is true.
 *   No optimization / optimized price data.`
 * - **completed**: includes all products, augmented with deterministic mock
 *   `optimizedPriceInRobux` and `optimizationPercentage`.
 */
export function useMockExperimentProductDetails({
  universeId,
  status,
  pageSize,
}: UseExperimentProductDetailsParams) {
  const {
    allProducts,
    developerProducts,
    gamePasses,
    isAllProductsLoaded,
    hasNextDevProductsPage: hasNextPage,
    fetchNextDevProductsPage: fetchNextPage,
  } = useManagedProducts({ universeId, pageSize });

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
    hasNextPage,
    fetchNextPage,
  } as const;
}
