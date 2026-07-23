import { useMemo, useState } from 'react';
import type { ManagedProductType } from '../../manage-items/types';
import type { ExperimentProduct } from '../types';

export type UseExperimentProductsFiltersParams = {
  products: ExperimentProduct[];
  developerProducts: ExperimentProduct[];
  gamePasses: ExperimentProduct[];
};

export function useExperimentProductsFilters({
  products,
  developerProducts,
  gamePasses,
}: UseExperimentProductsFiltersParams) {
  const [typeFilter, setTypeFilter] = useState<ManagedProductType | null>(null);

  const filteredProducts = useMemo(() => {
    if (typeFilter === 'DeveloperProduct') {
      return developerProducts;
    }
    if (typeFilter === 'GamePass') {
      return gamePasses;
    }
    return products;
  }, [products, developerProducts, gamePasses, typeFilter]);

  return {
    typeFilter,
    setTypeFilter,
    filteredProducts,
  } as const;
}
