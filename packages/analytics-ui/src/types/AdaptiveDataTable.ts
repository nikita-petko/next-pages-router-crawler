import type { ReactNode } from 'react';

export type AdaptiveDataTablePrimitive = string | number | boolean;

export type AdaptiveDataTableValueContainerProps = {
  readonly children: ReactNode;
  readonly value: AdaptiveDataTablePrimitive;
};

export type AdaptiveDataTableTextOverflow = 'truncate' | 'wrap';

export type AdaptiveDataTableValueCell<
  TValue extends AdaptiveDataTablePrimitive = AdaptiveDataTablePrimitive,
> = {
  readonly type: 'value';
  readonly header: ReactNode;
  /** Whether to render the divider below this column's header. Defaults to true. */
  readonly headerDivider?: boolean;
  readonly value: TValue;
  readonly displayString?: (value: AdaptiveDataTablePrimitive) => string;
  readonly align?: 'start' | 'center' | 'end';
  /**
   * Controls long primitive string rendering after the table applies its internal maximum
   * preferred width. Defaults to `wrap`. Number and boolean display strings remain unbroken.
   */
  readonly textOverflow?: AdaptiveDataTableTextOverflow;
  /**
   * Customizes the rendered value cell while preserving the table's value and display
   * formatting. Use `children` for the formatted display string and `value` to configure a
   * visual container such as a Badge or Chip.
   */
  readonly renderContainer?: (props: AdaptiveDataTableValueContainerProps) => ReactNode;
} & (
  | {
      /** Value cells are sortable by default when onSortChange is provided. */
      readonly sortable?: true;
      /** Localized label announced by the sortable header button. */
      readonly sortAriaLabel: string;
    }
  | {
      readonly sortable: false;
      readonly sortAriaLabel?: string;
    }
);

export type AdaptiveDataTableTooltipConfig = {
  readonly title: string;
  readonly description?: string;
};

export type AdaptiveDataTableMenuItemBase = {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly tooltip?: AdaptiveDataTableTooltipConfig;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
};

export type AdaptiveDataTableMenuActionItem = AdaptiveDataTableMenuItemBase & {
  readonly kind: 'action';
  readonly onSelect: () => void;
};

export type AdaptiveDataTableMenuLinkItem = AdaptiveDataTableMenuItemBase & {
  readonly kind: 'link';
  readonly href: string;
  /** Overrides link navigation when defined. The callback runs without following `href`. */
  readonly onSelect?: () => void;
};

export type AdaptiveDataTableMenuItem =
  | AdaptiveDataTableMenuActionItem
  | AdaptiveDataTableMenuLinkItem;

export type AdaptiveDataTableMenuCell = {
  readonly type: 'display';
  readonly display: 'menu';
  readonly header?: ReactNode;
  /** Whether to render the divider below this column's header. Defaults to true. */
  readonly headerDivider?: boolean;
  readonly menuAriaLabel: string;
  readonly disabled?: boolean;
  readonly tooltip?: AdaptiveDataTableTooltipConfig;
  readonly items: readonly AdaptiveDataTableMenuItem[];
  readonly align?: 'start' | 'center' | 'end';
};

export type AdaptiveDataTableExpansionCellRenderProps = {
  readonly canExpand: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpanded: () => void;
};

export type AdaptiveDataTableExpansionCell = {
  readonly type: 'display';
  readonly display: 'expansion';
  readonly header?: ReactNode;
  /** Whether to render the divider below this column's header. Defaults to true. */
  readonly headerDivider?: boolean;
  readonly render: (props: AdaptiveDataTableExpansionCellRenderProps) => ReactNode;
  readonly align?: 'start' | 'center' | 'end';
};

export type AdaptiveDataTableDisplayCell =
  | AdaptiveDataTableMenuCell
  | AdaptiveDataTableExpansionCell;

export type AdaptiveDataTableCell = AdaptiveDataTableValueCell | AdaptiveDataTableDisplayCell;

/** Every own string key is a unique column ID. All rows must use the same keys and cell kinds. */
export type AdaptiveDataTableRow = Record<string, AdaptiveDataTableCell>;

/**
 * Symbol-backed metadata for structured rows rendered below an expanded root row.
 * Expansion is single-level: metadata on an expanded row is not traversed.
 */
export const AdaptiveDataTableExpandedRows = Symbol('AdaptiveDataTableExpandedRows');

export type AdaptiveDataTableExpandableRow<
  TRow extends AdaptiveDataTableRow,
  TExpandedRow extends AdaptiveDataTableRow = TRow,
> = TRow & {
  readonly [AdaptiveDataTableExpandedRows]?: readonly TExpandedRow[];
};

export type AdaptiveDataTableValueColumnId<TRow extends AdaptiveDataTableRow> = Extract<
  {
    readonly [TKey in keyof TRow]: TRow[TKey] extends AdaptiveDataTableValueCell ? TKey : never;
  }[keyof TRow],
  string
>;

export type AdaptiveDataTableSort<TColumnId extends string = string> = {
  readonly columnId: TColumnId;
  readonly direction: 'ascending' | 'descending';
};

export type AdaptiveDataTablePagination = {
  readonly mode: 'pagination';
  /** Zero-based page index owned by the consumer. */
  readonly pageIndex: number;
  readonly pageSize: number;
  readonly hasPreviousPage: boolean;
  /** Cursor returned by the current response. Null means there is no next page. */
  readonly nextCursor: string | null;
  readonly totalRowCount?: number;
  readonly onPreviousPage: () => void;
  readonly onNextPage: (cursor: string) => void;
};

export type AdaptiveDataTableInfiniteScroll = {
  readonly mode: 'infinite';
  /** Cursor returned by the latest response. Null means all rows are loaded. */
  readonly nextCursor: string | null;
  /**
   * Requests the next cursor. React Query consumers can ignore the argument and call
   * `fetchNextPage`; `getNextPageParam` remains responsible for passing the cursor to the query.
   */
  readonly onLoadMore: (cursor: string) => void;
  /**
   * Prevents overlapping incremental requests and renders the loading row. React Query consumers
   * can pass `isFetchingNextPage`; use the table's `isLoading` for overall fetching state.
   */
  readonly isLoadingMore?: boolean;
  /**
   * Renders the incremental error row while preserving loaded rows. React Query consumers can
   * pass `isFetchNextPageError`. The row retries the same cursor through `onLoadMore`.
   */
  readonly isLoadMoreError?: boolean;
};

export type AdaptiveDataTableNavigation =
  | AdaptiveDataTablePagination
  | AdaptiveDataTableInfiniteScroll;

export type AdaptiveDataTableLabels = {
  readonly loading: string;
  readonly error: string;
  readonly emptyState: string;
  readonly retry: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly page: (pageIndex: number, pageSize: number, totalRowCount?: number) => string;
};

export type AdaptiveDataTableProps<
  TRow extends AdaptiveDataTableRow,
  TExpandedRow extends AdaptiveDataTableRow = TRow,
> = {
  /**
   * Cell-oriented rows. Object keys become column IDs and insertion order becomes column order.
   * The first non-empty row defines and caches the column schema.
   */
  readonly rows: readonly AdaptiveDataTableExpandableRow<TRow, TExpandedRow>[];
  readonly getRowId: (row: TRow) => string;
  /**
   * Returns a stable ID for an expanded row within its parent nested table. Provide this when
   * expanded-row values can change or their cells render stateful content. When omitted, the
   * table derives identity from cell values and duplicate occurrence order.
   */
  readonly getExpandedRowId?: (row: TExpandedRow) => string;
  readonly sort?: AdaptiveDataTableSort<AdaptiveDataTableValueColumnId<TRow>> | null;
  /** Called for sorting changes. Fetching and cursor reset stay consumer-owned. */
  readonly onSortChange?: (
    sort: AdaptiveDataTableSort<AdaptiveDataTableValueColumnId<TRow>> | null,
  ) => void;
  readonly navigation: AdaptiveDataTableNavigation;
  readonly labels: AdaptiveDataTableLabels;
  /**
   * Prevents incremental requests while the main dataset is fetching. When there are no rows,
   * this also renders the centered loading state. React Query consumers can pass `isFetching`.
   */
  readonly isLoading?: boolean;
  /** Renders `labels.error`. React Query consumers can pass `isError`. */
  readonly isError?: boolean;
  readonly size?: 'XSmall' | 'Small' | 'Medium';
  readonly variant?: 'Divided' | 'Framed';
};
