import { useMemo, useState } from 'react';
import type { ExperimentProduct } from '../../types';
import type { ExperimentProductsFilters } from '../types';

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
  const [filters, setFilters] = useState<ExperimentProductsFilters>({});

  const filteredProducts = useMemo(() => {
    if (filters.typeFilter === 'DeveloperProduct') {
      return developerProducts;
    }
    if (filters.typeFilter === 'GamePass') {
      return gamePasses;
    }
    return products;
  }, [products, developerProducts, gamePasses, filters]);

  return {
    filters,
    setFilters,
    filteredProducts,
  } as const;
}
