import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import type { Product } from '../types/product';

type SortableColumn =
  | 'name'
  | 'productType'
  | 'regionalPricing'
  | 'optimization'
  | 'defaultPrice'
  | 'recommendedPrice';

type CompareFn = (a: Product, b: Product) => number;

const compareByName: CompareFn = (a, b) => a.name.localeCompare(b.name);

const compareByProductType: CompareFn = (a, b) => a.productType.localeCompare(b.productType);

// Ascending shows enabled before disabled
const compareByRegionalPricing: CompareFn = (a, b) => {
  if (a.isRegionalPricingEnabled === b.isRegionalPricingEnabled) return 0;
  return a.isRegionalPricingEnabled ? -1 : 1; // enabled > disabled
};

// Ascending shows higher optimization percentages first
const compareByOptimization: CompareFn = (a, b) =>
  (b.optimizationPercentage ?? 0) - (a.optimizationPercentage ?? 0);

const compareByDefaultPrice: CompareFn = (a, b) => a.defaultPriceInRobux - b.defaultPriceInRobux;

const compareByRecommendedPrice: CompareFn = (a, b) =>
  (a.recommendedPriceInRobux ?? 0) - (b.recommendedPriceInRobux ?? 0);

const comparators = {
  name: compareByName,
  productType: compareByProductType,
  regionalPricing: compareByRegionalPricing,
  optimization: compareByOptimization,
  defaultPrice: compareByDefaultPrice,
  recommendedPrice: compareByRecommendedPrice,
} as const satisfies Record<SortableColumn, CompareFn>;

// eslint-disable-next-line import/prefer-default-export -- keep named export
export function sortPriceOptimizationProducts(
  products: Product[],
  column: SortableColumn | undefined,
  order: SortOrder,
): Product[] {
  if (order === 'default' || column === undefined) {
    return products;
  }

  const comparator = comparators[column];
  const sorted = [...products].sort(comparator);
  return order === 'desc' ? sorted.reverse() : sorted;
}
