import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import type { HardCodedPriceInstance, SortableColumn } from '../types';

export type CompareFn = (a: HardCodedPriceInstance, b: HardCodedPriceInstance) => number;

const compareByLine: CompareFn = (a, b) => {
  return a.line - b.line;
};

const compareByFilename: CompareFn = (a, b) => {
  const filenameComparison = a.filename.localeCompare(b.filename);
  if (filenameComparison !== 0) {
    return filenameComparison;
  }

  return compareByLine(a, b);
};

// For now, only sort by filename (secondary sort by line)
const comparators = {
  filename: compareByFilename,
} as const satisfies Record<SortableColumn, CompareFn>;

export function sortHardCodedInstances(
  items: HardCodedPriceInstance[],
  column: SortableColumn | undefined,
  order: SortOrder,
) {
  if (order === 'default' || column === undefined) {
    return items;
  }

  const comparator = comparators[column];

  const sorted = [...items].sort(comparator);
  return order === 'desc' ? sorted.reverse() : sorted;
}
