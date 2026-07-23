export enum TableSortOrder {
  asc = 'asc',
  desc = 'desc',
}
export type TableSort<TColumnKey> = {
  direction: TableSortOrder;
  isFixedOrder?: boolean;
  hideSortIcon?: boolean;
  onClick?: (key: TColumnKey, order?: TableSortOrder) => void;
};
