import { useState, useMemo } from 'react';
import type { ManagedProduct } from '../../types';
import type { ManagedProductsFilters } from '../types';

type UseManagedProductsFiltersParams = {
  products: ManagedProduct[];
  developerProducts: ManagedProduct[];
  gamePasses: ManagedProduct[];
};

export function useManagedProductsFilters({
  products,
  developerProducts,
  gamePasses,
}: UseManagedProductsFiltersParams) {
  const [filters, setFilters] = useState<ManagedProductsFilters>({});

  const filteredProducts = useMemo(() => {
    let result = products;

    if (filters.typeFilter === 'DeveloperProduct') {
      result = developerProducts;
    } else if (filters.typeFilter === 'GamePass') {
      result = gamePasses;
    }

    if (filters.statusFilter === 'enabled') {
      result = result.filter((p) => p.isManagedPricingEnabled);
    } else if (filters.statusFilter === 'disabled') {
      result = result.filter((p) => !p.isManagedPricingEnabled);
    }

    return result;
  }, [products, developerProducts, gamePasses, filters]);

  return {
    filters,
    setFilters,
    filteredProducts,
  } as const;
}
