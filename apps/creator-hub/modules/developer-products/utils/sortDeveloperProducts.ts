import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import type { DeveloperProductConfig, SortableColumn } from '../types';

type CompareFn = (a: DeveloperProductConfig, b: DeveloperProductConfig) => number;

const compareByName: CompareFn = (a, b) => a.name.localeCompare(b.name);

const compareByProductId: CompareFn = (a, b) => a.productId - b.productId;

const compareByPrice: CompareFn = (a, b) => {
  const priceA = (a.isForSale ? a.defaultPriceInRobux : null) ?? -1;
  const priceB = (b.isForSale ? b.defaultPriceInRobux : null) ?? -1;
  return priceA - priceB;
};

/**
 * Returns a sort value for a boolean toggle column (regional pricing, price optimization)
 * where offsale or null-priced products are grouped at the bottom.
 *
 * Ascending:  enabled (2) → disabled (1) → offsale (0)
 * Descending: disabled (2) → enabled (1) → offsale (0)
 */
const getToggleSortValue = (
  isForSale: boolean,
  defaultPriceInRobux: number | null,
  isEnabled: boolean,
  order: 'asc' | 'desc',
): number => {
  if (!isForSale || defaultPriceInRobux === null) {
    return 0;
  }

  if (order === 'asc') {
    return isEnabled ? 2 : 1; // (asc) enabled > disabled > offsale
  }

  return isEnabled ? 1 : 2; // (desc) disabled > enabled > offsale
};

const makeToggleCompareFn =
  (getEnabled: (p: DeveloperProductConfig) => boolean): ((order: 'asc' | 'desc') => CompareFn) =>
  (order) =>
  (a, b) => {
    const valueA = getToggleSortValue(a.isForSale, a.defaultPriceInRobux, getEnabled(a), order);
    const valueB = getToggleSortValue(b.isForSale, b.defaultPriceInRobux, getEnabled(b), order);
    return valueB - valueA;
  };

const compareByRegionalPricing = makeToggleCompareFn((p) => p.isRegionalPricingEnabled);
const compareByPriceOptimization = makeToggleCompareFn(
  (p) => p.isInActivePriceOptimizationExperiment,
);
const compareByManagedPricing = makeToggleCompareFn((p) => p.isManagedPricingEnabled);

const comparators = {
  name: compareByName,
  productId: compareByProductId,
  price: compareByPrice,
} as const satisfies Partial<Record<SortableColumn, CompareFn>>;

export function sortDeveloperProducts(
  products: DeveloperProductConfig[],
  column: SortableColumn | undefined,
  order: SortOrder,
): DeveloperProductConfig[] {
  if (order === 'default' || column === undefined) {
    return products;
  }

  // Check special cases first with order
  switch (column) {
    case 'archivedDate': {
      // The BE sets updatedTimestamp to archive time when a product is archived.
      const sorted = [...products].sort(
        (a, b) => a.updatedTimestamp.getTime() - b.updatedTimestamp.getTime(),
      );
      return order === 'desc' ? sorted.toReversed() : sorted;
    }
    case 'regionalPricing':
      return [...products].sort(compareByRegionalPricing(order));
    case 'priceOptimization':
      return [...products].sort(compareByPriceOptimization(order));
    case 'managedPricing':
      return [...products].sort(compareByManagedPricing(order));
    case 'name':
    case 'price':
    case 'productId':
      break;
  }

  const comparator = comparators[column];
  const sorted = [...products].sort(comparator);
  return order === 'desc' ? sorted.toReversed() : sorted;
}
