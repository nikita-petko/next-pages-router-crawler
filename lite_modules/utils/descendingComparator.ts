import { Order } from '@type/genericManagementTable';
import { GetTableDisplayOrderByStatus } from '@utils/displayStatus';

function alphabeticalComparison(a: string, b: string) {
  const valueA = a.toLocaleLowerCase();
  const valueB = b.toLocaleLowerCase();

  if (valueA === undefined || valueA === null) {
    return 1; // Put undefined values at the end for descending order
  }
  if (valueB === undefined || valueB === null) {
    return -1; // Put undefined values at the end for descending order
  }
  if (valueB < valueA) {
    return -1;
  }
  if (valueB > valueA) {
    return 1;
  }
  return 0;
}
// Decending comparator to use to sort all column. It will treat columns as string if part
// of a specific column

export function DescendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  const rawA = a[orderBy];
  const rawB = b[orderBy];
  let valueA = String(rawA);
  let valueB = String(rawB);

  // Special order handling for status
  if (orderBy === 'status_text') {
    const updatedTimestampA = String(a['updated_timestamp_ms' as keyof T]);
    const updatedTimestampB = String(b['updated_timestamp_ms' as keyof T]);
    valueA = `${GetTableDisplayOrderByStatus(valueA)}${updatedTimestampA}`;
    valueB = `${GetTableDisplayOrderByStatus(valueB)}${updatedTimestampB}`;
    return alphabeticalComparison(valueA, valueB);
  }
  if (orderBy === 'name' || orderBy === 'creator_username') {
    return alphabeticalComparison(valueA, valueB);
  }

  // Check the raw values (before String()) so optional numerics like ROAS keep
  // undefined distinct from 0. Missing values sort last in descending order.
  if (rawA == null && rawB == null) {
    return 0;
  }
  if (rawA == null) {
    return 1;
  }
  if (rawB == null) {
    return -1;
  }

  let numericValueA = parseFloat(valueA.replace(/,/g, ''));
  let numericValueB = parseFloat(valueB.replace(/,/g, ''));

  if (Number.isNaN(numericValueA)) {
    numericValueA = 0;
  }
  if (Number.isNaN(numericValueB)) {
    numericValueB = 0;
  }

  if (numericValueB < numericValueA) {
    return -1;
  }
  if (numericValueB > numericValueA) {
    return 1;
  }
  return 0;
}

// Table sort comparator that keeps nullish optional numerics (e.g. missing ROAS)
// last for both ascending and descending. Negating DescendingComparator alone
// would put undefined first on ascending.
export function getSortComparator<T, K extends keyof T>(
  order: Order,
  orderBy: K,
): (a: T, b: T) => number {
  return (a, b) => {
    const rawA = a[orderBy];
    const rawB = b[orderBy];
    if (rawA == null || rawB == null) {
      if (rawA == null && rawB == null) {
        return 0;
      }
      if (rawA == null) {
        return 1;
      }
      return -1;
    }
    return order === 'desc'
      ? DescendingComparator(a, b, orderBy)
      : -DescendingComparator(a, b, orderBy);
  };
}
