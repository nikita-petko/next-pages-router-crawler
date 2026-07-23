import React, { useMemo, useCallback, useState } from 'react';
import type { GenericTablePaginationSpec } from '@modules/charts-generic/tables/GenericTablePagination';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  CellDataType,
  GenericTableV2RowExpansionConfig,
  TableConfig,
} from '@modules/charts-generic/tables/types/GenericTableType';
import { TableSortOrder } from '@modules/charts-generic/tables/types/TableSort';
import useMappedApiRequest from '../../../hooks/useMappedApiRequest';
import type { PaginationResponse } from '../../../hooks/usePaginatedRequest';
import usePaginatedRequest from '../../../hooks/usePaginatedRequest';
import type { TablePaginationSpec } from './types';
import useStableTableRows from './useStableTableRows';

export type TableDataColumnConfig<TColumnKey> = Omit<TableColumnConfig<TColumnKey>, 'sort'> & {
  sort?: {
    direction: TableSortOrder;
    isServerSideSorting?: boolean;
    isFixedOrder?: boolean;
    hideSortIcon?: boolean;
  };
};

export type PaginatedColumnRequest<
  TRowData,
  TRowKey extends string | number,
  TColumnKey extends string,
> = {
  columnKey: TColumnKey;
  rows: {
    id: TRowKey;
    data: TRowData;
  }[];
  pagination: { paginationToken?: string; pageSize: number };
  sort?: { direction: TableSortOrder };
};

export type RowDataResponse<TRowData, TRowKey extends string | number> = {
  rowId: TRowKey; // Single row ID
  data: CellDataType; // Single cell value for this column
  rowData: TRowData; // Rich data for this specific row
};

// Generic types for the table
export type TGenericDataTableProps<
  TRowData,
  TRowKey extends string | number,
  TColumnKey extends string,
> = {
  getColumnsData: (
    request: PaginatedColumnRequest<TRowData, TRowKey, TColumnKey>,
  ) => Promise<PaginationResponse<RowDataResponse<TRowData, TRowKey>>>;

  columnConfigs: TableDataColumnConfig<TColumnKey>[];
  pagination?: TablePaginationSpec;

  // Table props
  tableConfig?: TableConfig<TColumnKey>;
  getTableHeader?: (
    data: Map<TColumnKey, CellDataType>[],
    isDataLoading: boolean,
  ) => React.JSX.Element;

  footer?: React.JSX.Element | undefined;
  rowRange?: { start: number; end: number };
  emptyStateTableHeight?: number;
  isInTabSwitchedContext?: boolean;
  formatCellData?: (columnKey: TColumnKey, row: RowDataResponse<TRowData, TRowKey>) => CellDataType;
  rowExpansion?: GenericTableV2RowExpansionConfig<TColumnKey>;
  isRequestEnabled?: boolean;
};

const GenericDataTable = <TRowData, TRowKey extends string | number, TColumnKey extends string>({
  getColumnsData,
  columnConfigs,
  pagination,
  tableConfig,
  getTableHeader,
  footer,
  rowRange,
  emptyStateTableHeight,
  isInTabSwitchedContext,
  formatCellData,
  rowExpansion,
  isRequestEnabled = true,
}: TGenericDataTableProps<TRowData, TRowKey, TColumnKey>) => {
  const columnKeys: TColumnKey[] = useMemo(() => {
    return columnConfigs.map((config) => config.columnKey);
  }, [columnConfigs]);

  // Determine initial sort from tableConfig.defaultActiveSort
  const initialSort = useMemo(() => {
    const firstColumnWithSort = columnKeys.find((key) =>
      columnConfigs.find((config) => config.columnKey === key && !!config.sort),
    );
    const defaultColumn = tableConfig?.defaultActiveSort ?? firstColumnWithSort ?? columnKeys[0];
    const columnConfig = columnConfigs.find((config) => config.columnKey === defaultColumn);

    if (tableConfig?.defaultActiveSort && !columnConfig) {
      const availableColumnKeys = columnKeys.join(', ');
      throw new Error(
        `Invalid defaultActiveSort: "${tableConfig.defaultActiveSort}" not found in column keys: [${availableColumnKeys}]. ` +
          `Make sure defaultActiveSort is a column key (like RAQIV2PredefinedTableColumnKey.FunnelUserTotalCount), not a dimension (like RAQIV2Dimension.FunnelStep).`,
      );
    }

    return {
      columnKey: defaultColumn,
      direction: columnConfig?.sort?.direction ?? TableSortOrder.desc,
    };
  }, [tableConfig, columnKeys, columnConfigs]);

  const [currentSort, setCurrentSort] = useState(initialSort);

  // Reconcile sort state when the column set changes (e.g. explore mode toggling
  // granularity removes the synthetic Timestamp column, or a caller swaps out
  // metric columns). `useState(initialSort)` only seeds on first mount, so
  // without this `currentSort.columnKey` can outlive its column and cause the
  // primary fetch to throw `Column spec not found for key: ...` before any
  // network request is made — surfacing as a spurious "Request failed".
  // Adjust during render when deps change instead of syncing via useEffect.
  if (!columnKeys.includes(currentSort.columnKey)) {
    setCurrentSort(initialSort);
  }

  // Phase 1: Fetch primary (sorted) column
  const isServerSideSorting = useMemo(() => {
    const primaryColumnConfig = columnConfigs.find(
      (config) => config.columnKey === currentSort.columnKey,
    );
    return !!primaryColumnConfig?.sort?.isServerSideSorting;
  }, [columnConfigs, currentSort.columnKey]);

  const primaryColumnInitialRequest = useMemo(() => {
    return {
      columnKey: currentSort.columnKey,
      rows: [], // Empty array for primary column
      pagination: { pageSize: pagination?.initialPageSize ?? 10 },
      ...(isServerSideSorting && { sort: { direction: currentSort.direction } }),
    };
  }, [
    currentSort.columnKey,
    currentSort.direction,
    isServerSideSorting,
    pagination?.initialPageSize,
  ]);

  const {
    data: primaryRowData,
    totalData: primaryRowDataAll,
    isDataLoading: isPrimaryLoading,
    isResponseFailed: isPrimaryFailed,
    isUserForbidden: isPrimaryForbidden,
    page,
    pageSize,
    total,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
    setPageSize,
  } = usePaginatedRequest(
    isRequestEnabled ? primaryColumnInitialRequest : undefined,
    getColumnsData,
    pagination?.initialPageSize,
    !isServerSideSorting,
  );

  // Phase 2: Fetch other columns based on sorted rows (only after primary rows are available)
  const effectivePrimaryData = isServerSideSorting ? primaryRowData : primaryRowDataAll;

  const otherColumnKeys = useMemo(
    () =>
      !isPrimaryLoading && effectivePrimaryData.length > 0
        ? columnKeys.filter((key) => key !== currentSort.columnKey)
        : ([] as TColumnKey[]),
    [columnKeys, currentSort.columnKey, effectivePrimaryData, isPrimaryLoading],
  );

  const makeOtherColumnsRequest = useCallback(
    async (keys: TColumnKey[]) => {
      if (!effectivePrimaryData.length) {
        return new Map<TColumnKey, RowDataResponse<TRowData, TRowKey>[]>();
      }

      const rowsArray = effectivePrimaryData.map((row) => ({
        id: row.rowId,
        data: row.rowData,
      }));

      const requests = keys.map(async (columnKey) => {
        const response = await getColumnsData({
          columnKey,
          rows: rowsArray,
          pagination: { pageSize: effectivePrimaryData.length, paginationToken: '' },
          // No sort parameter for non-primary columns
        });
        return [columnKey, response.values ?? []] as const;
      });

      const results = await Promise.all(requests);
      return new Map(results);
    },
    [effectivePrimaryData, getColumnsData],
  );

  const {
    data: otherColumnsDataMap,
    isDataLoading: isOtherColumnsLoading,
    isResponseFailed: isOtherColumnsFailed,
  } = useMappedApiRequest(otherColumnKeys, makeOtherColumnsRequest);

  const handleSortChange = useCallback((columnKey: TColumnKey, order?: TableSortOrder) => {
    if (!order) {
      return;
    }
    setCurrentSort({ columnKey, direction: order });
  }, []);

  // Combine all column data into unified row-based structure
  const allRowData = useMemo(() => {
    const combinedRows = new Map<TRowKey, Map<TColumnKey, CellDataType>>();

    effectivePrimaryData.forEach((row) => {
      const rowMap = new Map<TColumnKey, CellDataType>();
      rowMap.set(
        currentSort.columnKey,
        formatCellData ? formatCellData(currentSort.columnKey, row) : row.data,
      );
      combinedRows.set(row.rowId, rowMap);
    });

    otherColumnsDataMap?.forEach((columnRowData, columnKey) => {
      if (columnRowData && Array.isArray(columnRowData)) {
        columnRowData.forEach((rowResponse) => {
          const existingRowMap = combinedRows.get(rowResponse.rowId);
          if (existingRowMap) {
            existingRowMap.set(
              columnKey,
              formatCellData ? formatCellData(columnKey, rowResponse) : rowResponse.data,
            );
          }
        });
      }
    });
    return combinedRows;
  }, [currentSort.columnKey, effectivePrimaryData, formatCellData, otherColumnsDataMap]);

  const { tableData, getRowKey } = useStableTableRows<TRowData, TRowKey, TColumnKey>(
    effectivePrimaryData,
    allRowData,
    columnKeys,
  );

  const enhancedColumnConfigs: TableColumnConfig<TColumnKey>[] = useMemo(() => {
    return columnConfigs.map((config) => ({
      ...config,
      ...(config.sort && {
        sort: {
          ...config.sort,
          onClick: config.sort.isServerSideSorting ? handleSortChange : undefined,
        },
      }),
    }));
  }, [columnConfigs, handleSortChange]);

  const paginationSpec = useMemo((): GenericTablePaginationSpec | null => {
    if (!pagination?.initialPageSize) {
      return null;
    }

    return {
      page,
      pageSize,
      total,
      hasNext,
      hasPrevious,
      onNextPage: nextPage,
      onPreviousPage: previousPage,
      pageSizeOptions: pagination?.pageSizeOptions ?? [10, 25, 50, 100],
      setPageSize,
    };
  }, [
    pagination?.initialPageSize,
    pagination?.pageSizeOptions,
    page,
    pageSize,
    total,
    hasNext,
    hasPrevious,
    nextPage,
    previousPage,
    setPageSize,
  ]);

  const isOtherPhaseLoading = effectivePrimaryData.length > 0 && isOtherColumnsLoading;
  const isDataLoading = !isRequestEnabled || isPrimaryLoading || isOtherPhaseLoading;
  const isResponseFailed = isPrimaryFailed || isOtherColumnsFailed;
  const isUserForbidden = isPrimaryForbidden;

  const tableHeader = useMemo(() => {
    if (getTableHeader) {
      return getTableHeader(tableData, isDataLoading);
    }
    return undefined;
  }, [getTableHeader, tableData, isDataLoading]);

  // If primary column fails, show error
  if (isPrimaryFailed || isPrimaryForbidden) {
    return (
      <GenericTableV2
        isDataLoading={false}
        isResponseFailed={isPrimaryFailed}
        isUserForbidden={isPrimaryForbidden}
        showNoDataMessage={false}
        rowData={[]}
        columnConfigs={enhancedColumnConfigs}
        tableConfig={{
          ...tableConfig,
          defaultActiveSort: currentSort.columnKey,
        }}
        tableHeader={tableHeader}
        footer={footer}
        rowRange={rowRange}
        emptyStateTableHeight={emptyStateTableHeight}
        isInTabSwitchedContext={isInTabSwitchedContext}
        rowExpansion={rowExpansion}
      />
    );
  }

  return (
    <GenericTableV2
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
      showNoDataMessage={total !== undefined && total === 0}
      rowData={isDataLoading ? [] : tableData}
      columnConfigs={enhancedColumnConfigs}
      pagination={isServerSideSorting ? paginationSpec : undefined}
      tableConfig={{
        ...tableConfig,
        defaultActiveSort: currentSort.columnKey,
      }}
      tableHeader={tableHeader}
      footer={footer}
      rowRange={rowRange}
      emptyStateTableHeight={emptyStateTableHeight}
      isInTabSwitchedContext={isInTabSwitchedContext}
      getRowKey={getRowKey}
      rowExpansion={rowExpansion}
    />
  );
};

export default GenericDataTable;
