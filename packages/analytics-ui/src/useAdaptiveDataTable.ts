import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ColumnDef,
  ExpandedState,
  OnChangeFn,
  SortingState,
  Updater,
} from '@tanstack/react-table';
import {
  columnVisibilityFeature,
  rowExpandingFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import {
  getAdaptiveDataTableColumnLayout,
  type AdaptiveDataTableColumnBlueprint,
} from './adaptiveDataTableColumnSizing';
import type { AdaptiveDataTableTextStyles } from './measureAdaptiveDataTableText';
import type {
  AdaptiveDataTableExpandableRow,
  AdaptiveDataTableProps,
  AdaptiveDataTableRow,
  AdaptiveDataTableValueColumnId,
} from './types/AdaptiveDataTable';
import { AdaptiveDataTableExpandedRows } from './types/AdaptiveDataTable';

/* oxlint-disable react/react-compiler -- TanStack Table returns intentionally non-memoizable callbacks. */

const ColumnWidthSampleSize = 50;
const EmptyMeasurementRows: readonly never[] = [];

const Features = tableFeatures({
  columnVisibilityFeature,
  rowExpandingFeature,
  rowSortingFeature,
});

export type AdaptiveTableFeatures = typeof Features;

const resolveSortingUpdater = (
  updater: Updater<SortingState>,
  previous: SortingState,
): SortingState => (typeof updater === 'function' ? updater(previous) : updater);

type CachedTableShape<TRow extends AdaptiveDataTableRow> = {
  readonly columnRow: TRow;
  readonly measurementRows: readonly TRow[];
};

type UseAdaptiveDataTableOptions<
  TRow extends AdaptiveDataTableRow,
  TExpandedRow extends AdaptiveDataTableRow,
> = Pick<
  AdaptiveDataTableProps<TRow, TExpandedRow>,
  'getRowId' | 'onSortChange' | 'rows' | 'sort'
> & {
  readonly availableWidth?: number;
  readonly expanded: ExpandedState;
  readonly onExpandedChange: OnChangeFn<ExpandedState>;
  readonly textStyles?: AdaptiveDataTableTextStyles;
};

const getColumnBlueprints = <TRow extends AdaptiveDataTableRow>(
  row: TRow | undefined,
): readonly AdaptiveDataTableColumnBlueprint[] => {
  const blueprints: AdaptiveDataTableColumnBlueprint[] = [];
  if (!row) {
    return blueprints;
  }
  for (const id in row) {
    blueprints.push({ cell: row[id], id });
  }
  return blueprints;
};

const isValueColumnId = <TRow extends AdaptiveDataTableRow>(
  id: string,
  blueprints: readonly AdaptiveDataTableColumnBlueprint[],
): id is AdaptiveDataTableValueColumnId<TRow> =>
  blueprints.some((blueprint) => blueprint.id === id && blueprint.cell.type === 'value');

const hasExpandedRows = <
  TRow extends AdaptiveDataTableRow,
  TExpandedRow extends AdaptiveDataTableRow,
>(
  row: TRow,
): boolean => {
  const expandableRow: AdaptiveDataTableExpandableRow<TRow, TExpandedRow> = row;
  return (expandableRow[AdaptiveDataTableExpandedRows]?.length ?? 0) > 0;
};

/** Internal TanStack adapter. No TanStack type is exposed by the package API. */
export const useAdaptiveDataTable = <
  TRow extends AdaptiveDataTableRow,
  TExpandedRow extends AdaptiveDataTableRow,
>({
  availableWidth,
  expanded,
  getRowId,
  onExpandedChange,
  onSortChange,
  rows,
  sort,
  textStyles,
}: UseAdaptiveDataTableOptions<TRow, TExpandedRow>) => {
  const firstRow = rows[0];
  const [cachedTableShape, setCachedTableShape] = useState<CachedTableShape<TRow> | undefined>(
    () =>
      firstRow
        ? {
            columnRow: firstRow,
            measurementRows: rows.slice(0, ColumnWidthSampleSize),
          }
        : undefined,
  );

  useEffect(() => {
    if (!cachedTableShape && firstRow) {
      setCachedTableShape({
        columnRow: firstRow,
        measurementRows: rows.slice(0, ColumnWidthSampleSize),
      });
    }
  }, [cachedTableShape, firstRow, rows]);

  const columnBlueprints = useMemo(
    () => getColumnBlueprints(cachedTableShape?.columnRow),
    [cachedTableShape],
  );
  const sorting = useMemo<SortingState>(
    () => (sort ? [{ id: sort.columnId, desc: sort.direction === 'descending' }] : []),
    [sort],
  );
  const handleSortingChange = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      const nextSorting = resolveSortingUpdater(updater, sorting)[0];
      onSortChange?.(
        nextSorting && isValueColumnId<TRow>(nextSorting.id, columnBlueprints)
          ? {
              columnId: nextSorting.id,
              direction: nextSorting.desc ? 'descending' : 'ascending',
            }
          : null,
      );
    },
    [columnBlueprints, onSortChange, sorting],
  );

  const tableColumns = useMemo<ColumnDef<AdaptiveTableFeatures, TRow>[]>(() => {
    const columns: ColumnDef<AdaptiveTableFeatures, TRow>[] = [];

    for (const blueprint of columnBlueprints) {
      if (blueprint.cell.type === 'value') {
        columns.push({
          accessorFn: (row) => {
            const cell = row[blueprint.id];
            return cell.type === 'value' ? cell.value : undefined;
          },
          enableSorting: blueprint.cell.sortable !== false && onSortChange !== undefined,
          id: blueprint.id,
          sortDescFirst: false,
        });
      } else {
        columns.push({ enableSorting: false, id: blueprint.id });
      }
    }

    return columns;
  }, [columnBlueprints, onSortChange]);

  const tableData = useMemo<TRow[]>(() => [...rows], [rows]);
  const table = useTable({
    autoResetExpanded: false,
    columns: tableColumns,
    data: tableData,
    enableMultiSort: false,
    features: Features,
    getRowId,
    getRowCanExpand: (row) => row.depth === 0 && hasExpandedRows<TRow, TExpandedRow>(row.original),
    manualSorting: true,
    onExpandedChange,
    onSortingChange: handleSortingChange,
    state: { expanded, sorting },
  });

  const cellsByColumnId = useMemo(
    () => new Map(columnBlueprints.map((blueprint) => [blueprint.id, blueprint.cell])),
    [columnBlueprints],
  );
  const measurementRows = cachedTableShape?.measurementRows ?? EmptyMeasurementRows;
  const columnLayout = useMemo(
    () =>
      getAdaptiveDataTableColumnLayout({
        availableWidth,
        columns: columnBlueprints,
        isSortingEnabled: onSortChange !== undefined,
        rows: measurementRows,
        textStyles,
      }),
    [availableWidth, columnBlueprints, measurementRows, onSortChange, textStyles],
  );

  return { cellsByColumnId, columnBlueprints, columnLayout, table };
};
