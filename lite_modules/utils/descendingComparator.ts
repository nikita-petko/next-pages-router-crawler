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
  let valueA = String(a[orderBy]);
  let valueB = String(b[orderBy]);

  // Special order handling for status
  if (orderBy === 'status_text') {
    const updatedTimestampA = String(a['updated_timestamp_ms' as keyof T]);
    const updatedTimestampB = String(b['updated_timestamp_ms' as keyof T]);
    valueA = `${GetTableDisplayOrderByStatus(valueA)}${updatedTimestampA}`;
    valueB = `${GetTableDisplayOrderByStatus(valueB)}${updatedTimestampB}`;
    return alphabeticalComparison(valueA, valueB);
  }
  if (orderBy === 'name') {
    return alphabeticalComparison(valueA, valueB);
  }

  if (valueA === undefined || valueA === null) {
    return 1; // Put undefined values at the end for descending order
  }
  if (valueB === undefined || valueB === null) {
    return -1; // Put undefined values at the end for descending order
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
