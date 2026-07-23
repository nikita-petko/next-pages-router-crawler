import { Table, TableBody } from '@rbx/foundation-ui';
import { type JSX, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import FoundationTablePagination from '@components/common/FoundationTablePagination';
import TableHeader from '@components/reporting/TableHeader';
import TableSkeletonRow from '@components/reporting/TableSkeletonRow';
import { EntityType } from '@constants/entity';
import {
  campaignTableNameCellIconSlotWidthPx,
  rowPaddingHorizontalTotalPx,
  SKELETON_ROWS_COUNT,
} from '@constants/genericManagementTableStyles';
import { useNewFlowStore } from '@stores/newFlowStoreProvider';
import {
  GenericSortableRowData,
  GenericTableRowProps,
  Order,
  SortableHeadCell,
  UnsortableHeadCell,
  UnsortableRowData,
} from '@type/genericManagementTable';
import { getSortComparator } from '@utils/descendingComparator';
import { ConvertEntityTypeEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';
import { GetLocalStorage, SetLocalStorage } from '@utils/localStorage';

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

interface GenericManagementTableProps {
  className: string;
  defaultRowsPerPage?: number;
  entityIdToUnsortableData: Map<string, UnsortableRowData>;
  entityType: EntityType;
  /**
   * When set, measures sortable name + leading icon slots for **visible rows only** (current
   * page after sort) to avoid O(n) DOM work for very large datasets.
   */
  firstColumnMeasurement?: {
    anchorClassName: string;
    enabled: boolean;
    textClassName: string;
  };
  /**
   * Optional explicit min-width for the first column (e.g. unit tests). When omitted, a
   * configured `firstColumnMeasurement` may populate it from the current page of rows only.
   */
  firstColumnMinWidthPx?: number;
  /**
   * Optional selector that picks at most one row id from the rows visible on the current page
   * (post-sort, post-pagination) to act as a dismissible-tooltip anchor. Invoked on every
   * render so the anchor follows sort/page/filter changes; receives the slice in display order.
   * The chosen row is informed via `RowElement`'s `isTooltipAnchor` prop.
   */
  getTooltipAnchorRowId?: (visibleRows: GenericSortableRowData[]) => string | undefined;
  headCells: (SortableHeadCell | UnsortableHeadCell)[];
  isLoading?: boolean;
  RowElement: (props: GenericTableRowProps) => JSX.Element;
  showFooter: boolean;
  sortableData: GenericSortableRowData[];
  tableId?: string;
}

const GenericManagementTable = ({
  className,
  defaultRowsPerPage = 10,
  entityIdToUnsortableData,
  entityType,
  firstColumnMeasurement,
  firstColumnMinWidthPx: firstColumnMinWidthPxProp,
  getTooltipAnchorRowId,
  headCells,
  isLoading = false,
  RowElement,
  showFooter,
  sortableData,
  tableId,
}: GenericManagementTableProps) => {
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [firstColumnMinWidthMeasured, setFirstColumnMinWidthMeasured] = useState<
    number | undefined
  >(undefined);
  const commitPendingStatusChanges = useNewFlowStore((state) => state.commitPendingStatusChanges);

  const maxCount = sortableData.length;

  const prefix = ConvertEntityTypeEnumToString(entityType);

  const storageKeyPrefix = tableId
    ? `trafficDriving_${prefix}_${tableId}`
    : `trafficDriving_${prefix}`;

  function useLocalStorageState<T extends string>(
    key: string,
    initialValue: T,
  ): [T, (val: T) => void] {
    const qualifiedKey = `${storageKeyPrefix}_${key}`;
    const existingValue = GetLocalStorage(qualifiedKey);
    const [value, setValue] = useState<T>(existingValue ? (existingValue as T) : initialValue);

    const setStoredValue = (val: T) => {
      setValue(val);
      SetLocalStorage(qualifiedKey, val);
    };

    return [value, setStoredValue];
  }

  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof GenericSortableRowData>('status_text');

  const [page, setPage] = useState<number>(0);

  const [rowsPerPage, setRowsPerPage] = useLocalStorageState<string>(
    'rowsPerPage',
    defaultRowsPerPage.toString(),
  );
  const rowsPerPageValue = parseInt(rowsPerPage, 10);

  useEffect(() => {
    if (!isLoading && headCells.length === 0) {
      CaptureException('List of column headers is empty. Nothing can be shown in table.');
    }
  }, [headCells.length, isLoading]);

  useEffect(() => {
    // Only adjust pagination when not loading to avoid race conditions with skeleton rendering
    if (isLoading) {
      return;
    }

    // If they are on a later page and the data set shrinks, reset to the last available page
    const lastAvailablePage = Math.max(0, Math.ceil(maxCount / rowsPerPageValue) - 1);
    if (page > lastAvailablePage) {
      setPage(lastAvailablePage);
    }
  }, [isLoading, maxCount, page, rowsPerPageValue]);

  const handlePageChange = (newPage: number) => {
    if (newPage > page) {
      logNativeClickEvent(EventName.NextPageClicked);
    }
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage.toString());
    setPage(0);
  };

  const handleRequestSort = (property: keyof GenericSortableRowData) => {
    commitPendingStatusChanges(entityType);
    const isDesc = orderBy === property && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(property);
    logNativeClickEvent(EventName.ChangeSortColumn, { sortKey: property, tableView: prefix });
  };

  const paginationStartIndex = page * rowsPerPageValue;
  const paginationEndIndex = page * rowsPerPageValue + rowsPerPageValue;

  // Page slice (sorted + paginated). Memoized so layout measurement only reruns when the slice
  // inputs change (avoids `exhaustive-deps` churn from a freshly allocated array each render).
  const visibleRows = useMemo(
    () =>
      stableSort<GenericSortableRowData>(sortableData, getSortComparator(order, orderBy)).slice(
        paginationStartIndex,
        paginationEndIndex,
      ),
    [order, orderBy, paginationEndIndex, paginationStartIndex, sortableData],
  );

  useLayoutEffect(() => {
    if (!firstColumnMeasurement?.enabled || visibleRows.length === 0) {
      setFirstColumnMinWidthMeasured(undefined);
      return;
    }

    const el = measureRef.current;
    if (!el) {
      return;
    }

    let contentMax = 0;
    visibleRows.forEach((row) => {
      el.textContent = row.name;
      const textW = el.scrollWidth;
      let icons = 0;
      if (row.is_auto_reload_ad_credit_enabled) {
        icons += campaignTableNameCellIconSlotWidthPx;
      }
      if (row.is_off_platform_request && !row.is_reporting_enabled) {
        icons += campaignTableNameCellIconSlotWidthPx;
      }
      contentMax = Math.max(contentMax, textW + icons);
    });

    setFirstColumnMinWidthMeasured(Math.ceil(contentMax + rowPaddingHorizontalTotalPx));
    el.textContent = '';
  }, [firstColumnMeasurement?.enabled, visibleRows]);

  const resolvedFirstColumnMinWidthPx = firstColumnMinWidthPxProp ?? firstColumnMinWidthMeasured;

  const tooltipAnchorRowId = getTooltipAnchorRowId?.(visibleRows);

  const tableBodyContent = isLoading
    ? Array.from({ length: SKELETON_ROWS_COUNT }, (_, index) => (
        <TableSkeletonRow headCells={headCells} key={`skeleton-row-${index}`} />
      ))
    : visibleRows.map((row) => (
        <RowElement
          firstColumnMinWidthPx={resolvedFirstColumnMinWidthPx}
          headCells={headCells}
          isTooltipAnchor={row.id === tooltipAnchorRowId}
          key={row.id}
          row={row}
          unsortableData={entityIdToUnsortableData.get(row.id)}
        />
      ));

  return (
    <>
      {firstColumnMeasurement?.enabled ? (
        <div className={firstColumnMeasurement.anchorClassName}>
          <span aria-hidden className={firstColumnMeasurement.textClassName} ref={measureRef} />
        </div>
      ) : null}
      <div className={className}>
        {/* min-width-max keeps the table at least as wide as its content so the
            scroll container handles horizontal overflow. */}
        <Table className='min-width-max'>
          <TableHeader
            firstColumnMinWidthPx={resolvedFirstColumnMinWidthPx}
            handleRequestSort={isLoading ? () => {} : handleRequestSort}
            headCells={headCells}
            order={order}
            orderBy={orderBy}
          />
          <TableBody>{tableBodyContent}</TableBody>
        </Table>
      </div>
      {showFooter && (
        <FoundationTablePagination
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          page={page}
          rowsPerPage={rowsPerPageValue}
          totalRows={maxCount}
        />
      )}
    </>
  );
};

export default GenericManagementTable;
