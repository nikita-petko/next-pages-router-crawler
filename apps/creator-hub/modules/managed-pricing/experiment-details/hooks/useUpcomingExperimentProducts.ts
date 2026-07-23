import { useMemo } from 'react';
import { useManagedProducts } from '../../manage-items/hooks/useManagedProducts';
import type { ExperimentProduct, ManagedProduct } from '../../types';
import type { UseExperimentProductsReturn } from '../types';
import { transformManagedProductToExperimentProduct } from '../utils/transformExperimentProducts';

type UseUpcomingExperimentProductsParams = {
  universeId: number;
  pageSize?: number;
};

function toUpcomingExperimentProducts(products: ManagedProduct[]): ExperimentProduct[] {
  return products
    .filter((p) => p.isManagedPricingEnabled)
    .map(transformManagedProductToExperimentProduct);
}

/**
 * Data hook for upcoming experiments. Wraps `useManagedProducts` and projects the results into
 * the unified `ExperimentProduct` shape, filtering down to managed-pricing-enabled items only.
 *
 * Used by `UpcomingProductDetailsTableContainer` since upcoming experiments have not yet produced
 * any experiment-product-details data.
 */
export function useUpcomingExperimentProducts({
  universeId,
  pageSize,
}: UseUpcomingExperimentProductsParams): UseExperimentProductsReturn {
  const {
    allProducts,
    developerProducts: managedDeveloperProducts,
    gamePasses: managedGamePasses,
    isAllProductsLoaded,
    hasNextDevProductsPage: hasNextPage,
    fetchNextDevProductsPage: fetchNextPage,
  } = useManagedProducts({ universeId, pageSize });

  const products = useMemo(() => toUpcomingExperimentProducts(allProducts), [allProducts]);

  const developerProducts = useMemo(
    () => toUpcomingExperimentProducts(managedDeveloperProducts),
    [managedDeveloperProducts],
  );

  const gamePasses = useMemo(
    () => toUpcomingExperimentProducts(managedGamePasses),
    [managedGamePasses],
  );

  return {
    products,
    developerProducts,
    gamePasses,
    isAllProductsLoaded,
    hasNextPage,
    fetchNextPage,
  } as const;
}
