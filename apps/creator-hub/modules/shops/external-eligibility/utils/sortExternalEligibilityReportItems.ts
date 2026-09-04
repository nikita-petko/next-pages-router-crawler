import type { SortOrder } from '@modules/monetization-shared/table-sort/types';
import type { ShopItem } from '../../types';

export type ExternalEligibilityReportSortColumn = 'name' | 'id';

type CompareFn = (a: ShopItem, b: ShopItem) => number;

const comparators = {
  name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  id: (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }),
} as const satisfies Record<ExternalEligibilityReportSortColumn, CompareFn>;

export function sortExternalEligibilityReportItems(
  items: ShopItem[],
  column: ExternalEligibilityReportSortColumn | undefined,
  order: SortOrder,
): ShopItem[] {
  if (order === 'default' || column === undefined) {
    return items;
  }

  const sorted = [...items].sort(comparators[column]);
  return order === 'desc' ? sorted.toReversed() : sorted;
}
