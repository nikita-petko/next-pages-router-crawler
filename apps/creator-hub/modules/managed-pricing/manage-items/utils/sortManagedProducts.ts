import type { ManagedProduct } from '../../types';
import type { SortableColumn, SortOrder } from '../types';

type CompareFn = (a: ManagedProduct, b: ManagedProduct) => number;

const compareByName: CompareFn = (a, b) => a.name.localeCompare(b.name);

const compareByManagedPricing: CompareFn = (a, b) => {
  if (a.isManagedPricingEnabled === b.isManagedPricingEnabled) {
    return 0;
  }
  return a.isManagedPricingEnabled ? -1 : 1; // enabled > disabled
};

const compareByPrice: CompareFn = (a, b) => {
  return a.defaultPriceInRobux - b.defaultPriceInRobux;
};

const compareByLastUpdated: CompareFn = (a, b) =>
  a.updatedTimestamp.getTime() - b.updatedTimestamp.getTime();

const comparators = {
  name: compareByName,
  managedPricing: compareByManagedPricing,
  price: compareByPrice,
  lastUpdated: compareByLastUpdated,
} as const satisfies Record<SortableColumn, CompareFn>;

export function sortManagedProducts(
  products: ManagedProduct[],
  column: SortableColumn | undefined,
  order: SortOrder,
): ManagedProduct[] {
  if (order === 'default' || column === undefined) {
    return products;
  }

  const comparator = comparators[column];
  const sorted = [...products].sort(comparator);
  return order === 'desc' ? sorted.toReversed() : sorted;
}
