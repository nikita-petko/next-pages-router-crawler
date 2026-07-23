import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import type { ExperimentProduct, ExperimentSortableColumn } from '../types';

type CompareFn = (a: ExperimentProduct, b: ExperimentProduct) => number;

const compareByName: CompareFn = (a, b) => a.name.localeCompare(b.name);

const compareByType: CompareFn = (a, b) => a.type.localeCompare(b.type);

const compareByPrice: CompareFn = (a, b) => a.defaultPriceInRobux - b.defaultPriceInRobux;

const compareByOptimizedPrice: CompareFn = (a, b) =>
  (a.optimizedPriceInRobux ?? 0) - (b.optimizedPriceInRobux ?? 0);

const compareByOptimization: CompareFn = (a, b) =>
  (a.optimizationPercentage ?? 0) - (b.optimizationPercentage ?? 0);

const comparators = {
  name: compareByName,
  type: compareByType,
  price: compareByPrice,
  optimizedPrice: compareByOptimizedPrice,
  optimization: compareByOptimization,
} as const satisfies Record<ExperimentSortableColumn, CompareFn>;

// eslint-disable-next-line import/prefer-default-export -- keep named export
export function sortExperimentProducts(
  products: ExperimentProduct[],
  column: ExperimentSortableColumn | undefined,
  order: SortOrder,
): ExperimentProduct[] {
  if (order === 'default' || column === undefined) {
    return products;
  }

  const comparator = comparators[column];
  const sorted = [...products].sort(comparator);
  return order === 'desc' ? sorted.reverse() : sorted;
}
