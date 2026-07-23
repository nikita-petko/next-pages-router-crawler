import { useState, useMemo } from 'react';
import type { ManagedProduct, ManagedProductType, ManagedPricingStatusFilter } from '../types';

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
  const [typeFilter, setTypeFilter] = useState<ManagedProductType | null>(null);
  const [statusFilter, setStatusFilter] = useState<ManagedPricingStatusFilter | null>(null);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (typeFilter === 'DeveloperProduct') {
      result = developerProducts;
    } else if (typeFilter === 'GamePass') {
      result = gamePasses;
    }

    if (statusFilter === 'enabled') {
      result = result.filter((p) => p.isManagedPricingEnabled);
    } else if (statusFilter === 'disabled') {
      result = result.filter((p) => !p.isManagedPricingEnabled);
    }

    return result;
  }, [products, developerProducts, gamePasses, typeFilter, statusFilter]);

  return {
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    filteredProducts,
  } as const;
}

export default useManagedProductsFilters;
