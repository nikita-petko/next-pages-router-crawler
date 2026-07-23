import { useCallback, useMemo } from 'react';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import type { RowDataResponse } from './GenericDataTable';

export type GetRowKey<TColumnKey extends string> = (
  rowInfo: Map<TColumnKey, CellDataType>,
  rowIndex: number,
) => string;

export type UseStableTableRowsResult<TColumnKey extends string> = {
  tableData: Map<TColumnKey, CellDataType>[];
  getRowKey: GetRowKey<TColumnKey>;
};

/**
 * Builds the row array consumed by `GenericTableV2` from the per-row combined
 * cell data, plus a `getRowKey` resolver that returns the source `rowId` for
 * each row instance.
 *
 * Two invariants are enforced here that the downstream `GenericTableV2`
 * relies on for stable React keys:
 *
 * 1. Dedupe by `rowId`. The paginated source is in principle keyed by
 *    `rowId`, but `usePaginatedRequest` accumulates pages with
 *    `[...prev, ...new]` and we have no guarantee a producer won't return
 *    the same identity twice across pages (the explore-mode formula
 *    pipeline has been observed to produce repeats for unknown-breakdown
 *    rows). Without deduping, the same row map appears in `tableData`
 *    twice; React then sees the same key twice and may duplicate or omit
 *    children on subsequent renders — surfacing as "Unknown" rows
 *    accumulating at the top of the table when the user toggles sort.
 *
 * 2. Maintain a `rowKeyByRowInfo` map so `getRowKey` can return the actual
 *    `rowId` instead of `JSON.stringify(rowInfo.entries())` (the default in
 *    GenericTableV2). The default collides whenever two distinct rows
 *    happen to render to identical cell content — e.g. multiple breakdown
 *    tuples with subtly different "empty" values (`""`, `null`,
 *    `"Unknown"`) all rendering as the literal "Unknown" label in every
 *    dimension column.
 *
 * Rows whose combined cell data does not yet cover every column are
 * dropped, matching the previous inline behaviour: the table only shows
 * rows for which every column has resolved.
 */
function useStableTableRows<TRowData, TRowKey extends string | number, TColumnKey extends string>(
  primaryData: ReadonlyArray<RowDataResponse<TRowData, TRowKey>>,
  combinedRowData: ReadonlyMap<TRowKey, Map<TColumnKey, CellDataType>>,
  columnKeys: ReadonlyArray<TColumnKey>,
): UseStableTableRowsResult<TColumnKey> {
  const { tableData, rowKeyByRowInfo } = useMemo(() => {
    const seenRowIds = new Set<TRowKey>();
    const rows: Map<TColumnKey, CellDataType>[] = [];
    const keys = new WeakMap<Map<TColumnKey, CellDataType>, TRowKey>();
    primaryData.forEach(({ rowId }) => {
      if (seenRowIds.has(rowId)) {
        return;
      }
      const existingRowData = combinedRowData.get(rowId);
      if (!existingRowData || existingRowData.size !== columnKeys.length) {
        return;
      }
      seenRowIds.add(rowId);
      rows.push(existingRowData);
      keys.set(existingRowData, rowId);
    });
    return { tableData: rows, rowKeyByRowInfo: keys };
  }, [primaryData, combinedRowData, columnKeys]);

  const getRowKey = useCallback<GetRowKey<TColumnKey>>(
    (rowInfo, rowIndex) => {
      // `rowInfo` references the same Map instance we stored above, so
      // WeakMap.get returns the row's `rowId`. Fall back to the index for
      // any row that wasn't tracked (defensive — shouldn't happen given
      // tableData is built from the same map).
      const id = rowKeyByRowInfo.get(rowInfo);
      return id !== undefined ? String(id) : `row-${rowIndex}`;
    },
    [rowKeyByRowInfo],
  );

  return { tableData, getRowKey };
}

export default useStableTableRows;
