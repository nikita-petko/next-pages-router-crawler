import type { HardCodedPriceReference, SortableColumn, SortOrder } from '../types';

export type CompareFn = (a: HardCodedPriceReference, b: HardCodedPriceReference) => number;

const compareByLine: CompareFn = (a, b) => {
  return a.lineStart - b.lineStart;
};

const compareByFilename: CompareFn = (a, b) => {
  const filenameComparison = a.filename.localeCompare(b.filename);
  if (filenameComparison !== 0) {
    return filenameComparison;
  }

  const pathComparison = a.path.localeCompare(b.path);
  if (pathComparison !== 0) {
    return pathComparison;
  }

  return compareByLine(a, b);
};

// For now, only sort by filename (secondary sort by path and line)
const comparators = {
  filename: compareByFilename,
} as const satisfies Record<SortableColumn, CompareFn>;

export function sortHardCodedInstances(
  items: HardCodedPriceReference[],
  column: SortableColumn | undefined,
  order: SortOrder,
) {
  if (order === 'default' || column === undefined) {
    return items;
  }

  const comparator = comparators[column];

  const sorted = [...items].sort(comparator);
  return order === 'desc' ? sorted.toReversed() : sorted;
}
