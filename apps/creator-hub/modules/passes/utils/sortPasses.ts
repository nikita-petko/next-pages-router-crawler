import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import type { GamePass, SortableColumn } from '../types';

type CompareFn = (a: GamePass, b: GamePass) => number;

const compareByName: CompareFn = (a, b) => a.name.localeCompare(b.name);

const compareByPassId: CompareFn = (a, b) => a.passId - b.passId;

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
  (getEnabled: (p: GamePass) => boolean): ((order: 'asc' | 'desc') => CompareFn) =>
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
  passId: compareByPassId,
  price: compareByPrice,
} as const satisfies Partial<Record<SortableColumn, CompareFn>>;

export function sortPasses(
  passes: GamePass[],
  column: SortableColumn | undefined,
  order: SortOrder,
): GamePass[] {
  if (order === 'default' || column === undefined) {
    return passes;
  }

  switch (column) {
    case 'regionalPricing':
      return [...passes].sort(compareByRegionalPricing(order));
    case 'priceOptimization':
      return [...passes].sort(compareByPriceOptimization(order));
    case 'managedPricing':
      return [...passes].sort(compareByManagedPricing(order));
    case 'name':
    case 'passId':
    case 'price':
      break;
  }

  const comparator = comparators[column];
  const sorted = [...passes].sort(comparator);
  return order === 'desc' ? sorted.toReversed() : sorted;
}
