import { useReducer, useMemo, useCallback } from 'react';
import type { SortOrder } from './types';

type UseSortItemsParams<TItem, TColumn extends string> = {
  /** Sort function to use for sorting items. Must return a new array. */
  sort: (items: TItem[], column: TColumn | undefined, order: SortOrder) => TItem[];
  /** Initial column to sort by */
  initialColumn?: TColumn;
  /** Initial order to sort by */
  initialOrder?: SortOrder;
};

type UseSortItemsReturn<TItem, TColumn extends string> = {
  /** List of sorted items */
  sortedItems: TItem[];
  /** Function to sort items by a column  */
  onSort: (column: TColumn) => void;
} & SortState<TColumn>;

type SortState<TColumn extends string> = {
  /** Current column being sorted by. Undefined if no active column. */
  sortColumn: TColumn | undefined;
  /** Current order of sorting. 'default' if no active column */
  sortOrder: SortOrder;
};

type SortAction<TColumn extends string> = { column: TColumn };

export function getNextOrder<TColumn extends string>(
  state: SortState<TColumn>,
  column: TColumn,
): SortOrder {
  const isNewColumn = state.sortColumn !== column;
  if (isNewColumn) {
    return 'asc';
  }
  switch (state.sortOrder) {
    case 'default':
      return 'asc';
    case 'asc':
      return 'desc';
    case 'desc':
      return 'default';
    default:
      return 'asc';
  }
}

function sortReducer<TColumn extends string>(
  state: SortState<TColumn>,
  action: SortAction<TColumn>,
): SortState<TColumn> {
  const { column } = action;
  const nextOrder = getNextOrder(state, column);
  const nextColumn = nextOrder === 'default' ? undefined : column;
  return { sortColumn: nextColumn, sortOrder: nextOrder };
}

function getInitialState<TColumn extends string>(
  initialColumn: TColumn | undefined,
  initialOrder: SortOrder,
): SortState<TColumn> {
  return {
    sortColumn: initialOrder === 'default' ? undefined : initialColumn,
    sortOrder: initialOrder,
  };
}

export function useSortItems<TItem, TColumn extends string>(
  items: TItem[],
  { initialColumn, sort, initialOrder = 'default' }: UseSortItemsParams<TItem, TColumn>,
): UseSortItemsReturn<TItem, TColumn> {
  const [{ sortColumn, sortOrder }, dispatch] = useReducer(
    sortReducer<TColumn>,
    getInitialState(initialColumn, initialOrder),
  );

  const onSort = useCallback((column: TColumn) => {
    dispatch({ column });
  }, []);

  const sortedItems = useMemo(() => {
    if (sortOrder === 'default') {
      return items;
    }
    return sort(items, sortColumn, sortOrder);
  }, [items, sort, sortColumn, sortOrder]);

  return {
    sortedItems,
    sortColumn,
    sortOrder,
    onSort,
  } as const;
}
