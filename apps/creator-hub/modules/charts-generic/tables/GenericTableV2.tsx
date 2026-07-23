import type { ReactElement, ReactNode } from 'react';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  ExpandLessIcon,
  ExpandMoreIcon,
  Grid,
  IconButton,
  Table,
  TableContainer,
  useMediaQuery,
  useTheme,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import Flex from '@modules/miscellaneous/components/Flex';
import type ChartFooter from '../charts/ChartFooter';
import type { GenericChartState } from '../charts/types/ChartTypes';
import useLocale from '../context/useLocale';
import formatCellContent from './formatCellContent';
import { formatCellBackgroundStyle, formatCellTextStyle } from './formatCellStyles';
import GenericTableBodyWrapper from './GenericTableBodyWrapper';
import GenericTableCell from './GenericTableCell';
import GenericTableHeaderRows from './GenericTableHeaderRow';
import GenericTablePagination from './GenericTablePagination';
import GenericTableRow from './GenericTableRow';
import useGenericRAQIV2TableContentStyles from './GenericTableV2.styles';
import useLocalPaginatedAdapter from './hooks/useLocalPaginatedAdapter';
import { getComparator } from './tableSortUtils';
import type { TableColumnConfig } from './types/GenericColumnType';
import { ColumnTypeToAlign, resolveTableColumnTitle } from './types/GenericColumnType';
import type {
  GenericTableV2Config,
  CellDataType,
  GenericTableV2ExpandedRowCellSpec,
} from './types/GenericTableType';
import type { TableSortOrder } from './types/TableSort';

const DefaultTablePageSizeOptions = [10, 25, 50, 100];

const defaultGetRowKey = <
  TColumnKey extends string | number,
  TActionType extends string,
  TActionOn = string,
>(
  rowInfo: Map<TColumnKey, CellDataType<TActionType, TActionOn>>,
) => {
  // Using just the first column key cannot guarantee uniqueness
  return JSON.stringify(Array.from(rowInfo.entries()));
};

function validateColumnKeys<TColumnKey extends string | number>(
  columnConfigs: TableColumnConfig<TColumnKey>[],
) {
  // Validate column keys are unique
  const columnKeys = columnConfigs.map((config) => config.columnKey);
  const uniqueColumnKeys = new Set(columnKeys);
  if (uniqueColumnKeys.size !== columnKeys.length) {
    const duplicates = new Set(
      columnKeys.filter((key, index) => columnKeys.indexOf(key) !== index),
    );
    throw new Error(`Duplicate column keys found: ${Array.from(duplicates).join(', ')}`);
  }
}

const SkipRowExpansionToggleSelector =
  'button, a, input, select, textarea, [role="button"], [role="link"], [role="menu"], [role="menuitem"], .MuiModal-root, .MuiPopover-root, .MuiMenu-root, [data-disable-row-expansion-toggle="true"]';

const shouldSkipRowExpansionToggle = (eventTarget: EventTarget | null) => {
  if (!(eventTarget instanceof Element)) {
    return false;
  }
  return eventTarget.closest(SkipRowExpansionToggleSelector) !== null;
};

const isExpandedRowCellSpec = <TActionType extends string, TActionOn = string>(
  value:
    | GenericTableV2ExpandedRowCellSpec<TActionType, TActionOn>
    | CellDataType<TActionType, TActionOn>,
): value is GenericTableV2ExpandedRowCellSpec<TActionType, TActionOn> =>
  'cellData' in value || 'colSpan' in value || 'skipCell' in value;

const normalizeExpandedRowCellSpec = <TActionType extends string, TActionOn = string>(
  value:
    | GenericTableV2ExpandedRowCellSpec<TActionType, TActionOn>
    | CellDataType<TActionType, TActionOn>
    | null
    | undefined,
): GenericTableV2ExpandedRowCellSpec<TActionType, TActionOn> => {
  if (value === null || value === undefined) {
    return { cellData: null };
  }
  if (isExpandedRowCellSpec(value)) {
    return {
      cellData: value.cellData ?? null,
      colSpan: value.colSpan,
      skipCell: value.skipCell,
    };
  }
  return { cellData: value };
};

type GenericV2TableProps<
  TColumnKey extends string | number,
  TActionType extends string,
  TActionOn = string,
> = GenericChartState &
  GenericTableV2Config<TColumnKey, TActionType, TActionOn> & {
    isInTabSwitchedContext?: boolean;
    classes?: {
      tableContainer?: string;
    };
    emptyStateTableHeight?: number;
    footer?: ReactElement<typeof ChartFooter>;
    rowRange?: { start: number; end: number };
    isDataLoading?: boolean;
  };

const GenericTableV2 = <
  TColumnKey extends string | number,
  TActionType extends string = string,
  TActionOn = string,
>({
  rowData,
  columnConfigs,
  pagination,
  tableConfig,
  showNoDataMessage,
  tableHeader,
  isInTabSwitchedContext,
  classes,
  emptyStateTableHeight,
  footer,
  getRowKey = defaultGetRowKey,
  rowRange,
  getIsRowSelected,
  rowExpansion,
  ...otherProps
}: GenericV2TableProps<TColumnKey, TActionType, TActionOn>) => {
  validateColumnKeys(columnConfigs);

  const { translate } = useTranslationWrapper(useTranslation());
  const theme = useTheme();
  const locale = useLocale();
  const {
    classes: {
      tableLayout,
      stickyFirstCellInRow,
      stickyLastCellInRow,
      withColumnDivider,
      tableContainerBorder,
      tabbedTableContainer,
    },
    cx,
  } = useGenericRAQIV2TableContentStyles();
  const isCompactView = useMediaQuery((t) => t.breakpoints.down('Medium'));

  const initialSort = columnConfigs.find(
    (config) => config.columnKey === tableConfig?.defaultActiveSort,
  );
  const [order, setOrder] = useState<TableSortOrder | undefined>(
    initialSort?.sort?.direction ?? undefined,
  );
  const [orderBy, setOrderBy] = useState<TColumnKey | undefined>(tableConfig?.defaultActiveSort);

  // Sync header state when the parent's `defaultActiveSort` (or that column's
  // own default direction) actually changes. We intentionally depend on the
  // primitive `(columnKey, direction)` pair rather than the full
  // `columnConfigs` array reference so unrelated parent re-renders that
  // create a fresh `columnConfigs` array don't clobber a user-driven sort
  // toggle (e.g. clicking the Timestamp header to flip asc<->desc would
  // otherwise snap back to the column's default direction the next time
  // upstream state changed, manifesting as "rows reappear / accumulate"
  // during interactive sorting in time-bucketed explore tables).
  const defaultActiveSortColumnKey = tableConfig?.defaultActiveSort;
  const defaultActiveSortDirection = useMemo(
    () =>
      columnConfigs.find((config) => config.columnKey === defaultActiveSortColumnKey)?.sort
        ?.direction,
    [columnConfigs, defaultActiveSortColumnKey],
  );
  useEffect(() => {
    setOrder(defaultActiveSortDirection ?? undefined);
    setOrderBy(defaultActiveSortColumnKey);
  }, [defaultActiveSortColumnKey, defaultActiveSortDirection]);

  const handleGenericSortOnClick = useCallback(
    (key: TColumnKey, sortOrder?: TableSortOrder) => {
      const columnConfig = columnConfigs.find((config) => config.columnKey === key);
      if (!columnConfig?.sort) {
        return;
      }
      if (columnConfig.sort.onClick) {
        columnConfig.sort.onClick(key, sortOrder);
      }
      setOrderBy(key);
      setOrder(sortOrder);
    },
    [columnConfigs],
  );

  const comparator = useMemo(() => {
    const withoutSortLabelOnClick = !columnConfigs.find((config) => config.columnKey === orderBy)
      ?.sort?.onClick;
    if (order && orderBy && withoutSortLabelOnClick) {
      return getComparator<TColumnKey, TActionType, TActionOn>(order, orderBy);
    }
    return null;
  }, [columnConfigs, order, orderBy]);

  // Filter out hidden columns, this include:
  // 1. Columns with hidden set to true
  // 2. Column keys on endAdormentColumnKeyInCompactView because they will be combined with
  //    the main columns
  const unHiddenColumnConfigs = useMemo(() => {
    const hiddenColumns: Set<TColumnKey> = new Set();
    columnConfigs.forEach((config) => {
      if (config.hidden) {
        hiddenColumns.add(config.columnKey);
      }
      if (isCompactView && config.endAdormentColumnKeyInCompactView) {
        hiddenColumns.add(config.endAdormentColumnKeyInCompactView);
      }
    });
    return columnConfigs.filter((config) => !hiddenColumns.has(config.columnKey));
  }, [columnConfigs, isCompactView]);

  const sortedParentRows = useMemo(() => {
    const rowDataWithoutSummaryRow = rowData.slice(tableConfig?.firstDataRowIsSummary ? 1 : 0);
    const orderedRows = comparator
      ? rowDataWithoutSummaryRow.sort(comparator)
      : rowDataWithoutSummaryRow;

    const filteredRows = rowRange
      ? orderedRows.slice(rowRange.start, rowRange.end + 1)
      : orderedRows;

    return filteredRows.map((rowInfo, rowIndex) => ({
      rowInfo,
      rowIndex,
      rowKey: getRowKey(rowInfo, rowIndex),
      isRowSelected: !!getIsRowSelected?.(rowInfo, rowIndex),
    }));
  }, [
    rowData,
    tableConfig?.firstDataRowIsSummary,
    comparator,
    rowRange,
    getRowKey,
    getIsRowSelected,
  ]);

  const [uncontrolledExpandedRowKeys, setUncontrolledExpandedRowKeys] = useState<string[]>(
    rowExpansion?.defaultExpandedRowKeys ?? [],
  );

  // Tracks which parent row's expansion group is currently hovered so we can
  // mirror the parent's hover state onto its expanded child rows.
  const [hoveredParentKey, setHoveredParentKey] = useState<string | null>(null);
  const expandedRowKeys = rowExpansion?.expandedRowKeys ?? uncontrolledExpandedRowKeys;
  const expandedRowKeySet = useMemo(() => new Set(expandedRowKeys), [expandedRowKeys]);

  const onExpandedRowKeysChange = rowExpansion?.onExpandedRowKeysChange;
  const isExpandedRowsControlled = rowExpansion?.expandedRowKeys !== undefined;
  const updateExpandedRowKeys = useCallback(
    (nextExpandedRowKeys: string[]) => {
      if (!isExpandedRowsControlled) {
        setUncontrolledExpandedRowKeys(nextExpandedRowKeys);
      }
      onExpandedRowKeysChange?.(nextExpandedRowKeys);
    },
    [isExpandedRowsControlled, onExpandedRowKeysChange],
  );

  const toggleRowExpansion = useCallback(
    (rowKey: string) => {
      if (!rowExpansion) {
        return;
      }
      const allowMultipleExpandedRows = rowExpansion.allowMultipleExpandedRows ?? true;
      const isRowExpanded = expandedRowKeySet.has(rowKey);
      let nextExpandedRowKeys: string[];
      if (isRowExpanded) {
        nextExpandedRowKeys = expandedRowKeys.filter((key) => key !== rowKey);
      } else if (allowMultipleExpandedRows) {
        nextExpandedRowKeys = [...expandedRowKeys, rowKey];
      } else {
        nextExpandedRowKeys = [rowKey];
      }
      updateExpandedRowKeys(nextExpandedRowKeys);
    },
    [expandedRowKeySet, expandedRowKeys, rowExpansion, updateExpandedRowKeys],
  );

  const expandedRowColumnsByColumn = rowExpansion?.expandedRowColumnsByColumn;
  const hasExpandedRowColumnsByColumn = useMemo(() => {
    if (!expandedRowColumnsByColumn) {
      return false;
    }
    return unHiddenColumnConfigs.some(
      (config) => expandedRowColumnsByColumn[config.columnKey] !== undefined,
    );
  }, [expandedRowColumnsByColumn, unHiddenColumnConfigs]);

  const { paginatedData: defaultPaginatedParentRows, ...defaultPaginationProps } =
    useLocalPaginatedAdapter(sortedParentRows);
  const defaultPaginationBundle = useMemo(
    () => ({
      ...defaultPaginationProps,
      pageSizeOptions: DefaultTablePageSizeOptions,
    }),
    [defaultPaginationProps],
  );

  const { effectiveParentRows, effectivePagination } = useMemo(
    () =>
      pagination === undefined && sortedParentRows.length > Math.min(...DefaultTablePageSizeOptions)
        ? {
            effectiveParentRows: defaultPaginatedParentRows,
            effectivePagination: defaultPaginationBundle,
          }
        : { effectiveParentRows: sortedParentRows, effectivePagination: pagination },
    [defaultPaginatedParentRows, defaultPaginationBundle, pagination, sortedParentRows],
  );

  const renderedRows = useMemo(() => {
    return effectiveParentRows.flatMap(({ rowInfo, rowIndex, rowKey, isRowSelected }) => {
      const isRowExpandable =
        hasExpandedRowColumnsByColumn &&
        (rowExpansion?.isRowExpandable?.(rowInfo, rowIndex) ?? true);
      const isRowExpanded = isRowExpandable && expandedRowKeySet.has(rowKey);
      const toggleThisRowExpansion = () => toggleRowExpansion(rowKey);

      const rowExpansionRenderParams = {
        rowInfo,
        rowIndex,
        rowKey,
        isExpanded: isRowExpanded,
        isCompactView,
        toggleRowExpansion: toggleThisRowExpansion,
        columnConfigs: unHiddenColumnConfigs,
        columnCount: unHiddenColumnConfigs.length,
      };

      const expansionTogglePlacement = rowExpansion?.expandTogglePlacement;
      const showExpansionToggle = isRowExpandable && (rowExpansion?.showToggleInFirstCell ?? true);
      const visibleColumnIndices = unHiddenColumnConfigs
        .map((cfg, idx) => ({ cfg, idx }))
        .filter(({ cfg }) => !rowInfo.get(cfg.columnKey)?.skipCell)
        .map(({ idx }) => idx);
      const firstVisibleColIndex = visibleColumnIndices[0] ?? 0;
      const lastVisibleColIndex =
        visibleColumnIndices[visibleColumnIndices.length - 1] ??
        Math.max(0, unHiddenColumnConfigs.length - 1);
      const isToggleBeforeContent = expansionTogglePlacement === undefined;
      let expansionToggleColumnIndex: number;
      if (expansionTogglePlacement === undefined) {
        expansionToggleColumnIndex = firstVisibleColIndex;
      } else {
        const keyedIndex = visibleColumnIndices.find(
          (idx) => unHiddenColumnConfigs[idx]?.columnKey === expansionTogglePlacement,
        );
        expansionToggleColumnIndex = keyedIndex ?? lastVisibleColIndex;
      }

      const isGroupHovered = !!tableConfig?.hover && hoveredParentKey === rowKey;
      const handleGroupMouseEnter = tableConfig?.hover
        ? () => setHoveredParentKey(rowKey)
        : undefined;
      const handleGroupMouseLeave = tableConfig?.hover
        ? () => setHoveredParentKey((prev) => (prev === rowKey ? null : prev))
        : undefined;

      const parentRow = (
        <GenericTableRow
          key={rowKey}
          hover={!!tableConfig?.hover}
          selected={isRowSelected}
          onMouseEnter={handleGroupMouseEnter}
          onMouseLeave={handleGroupMouseLeave}
          style={isGroupHovered ? { backgroundColor: theme.palette.states.hover } : undefined}
          onClick={
            rowExpansion?.expandOnRowClick && isRowExpandable
              ? (event) => {
                  if (shouldSkipRowExpansionToggle(event.target)) {
                    return;
                  }
                  toggleThisRowExpansion();
                }
              : undefined
          }>
          {unHiddenColumnConfigs.map((config, colIndex) => {
            const cellValue = rowInfo.get(config.columnKey);
            if (cellValue?.skipCell) {
              return null;
            }
            const formattedContent = formatCellContent(
              cellValue,
              config,
              locale,
              translate,
              false,
              isRowSelected,
            );

            let endAdormentContent: ReactNode | undefined;
            if (isCompactView && config.endAdormentColumnKeyInCompactView) {
              const endAdormentColumnConfig = columnConfigs.find(
                (c) => c.columnKey === config.endAdormentColumnKeyInCompactView,
              );
              if (endAdormentColumnConfig && !endAdormentColumnConfig.hidden) {
                const endAdormentCell = rowInfo.get(endAdormentColumnConfig.columnKey);
                endAdormentContent = formatCellContent(
                  endAdormentCell,
                  endAdormentColumnConfig,
                  locale,
                  translate,
                );
              }
            }

            const cellContent = endAdormentContent ? (
              <Flex justifyContent='space-between' alignItems='center' gap={1}>
                {formattedContent}
                {endAdormentContent}
              </Flex>
            ) : (
              formattedContent
            );
            const toggleContent =
              colIndex === expansionToggleColumnIndex && showExpansionToggle ? (
                <IconButton
                  aria-label={isRowExpanded ? 'Collapse row' : 'Expand row'}
                  size='small'
                  color='secondary'
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleThisRowExpansion();
                  }}>
                  {isRowExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              ) : null;
            const toggleWrapper = (
              <span data-disable-row-expansion-toggle='true' className='inline-flex items-center'>
                {toggleContent}
              </span>
            );
            const contentWithOptionalToggle = toggleContent ? (
              <Flex className='width-full' alignItems='center' gap={4}>
                {isToggleBeforeContent ? (
                  <>
                    {toggleWrapper}
                    <div className='grow-1 min-width-0'>{cellContent}</div>
                  </>
                ) : (
                  <>
                    <div className='grow-1 min-width-0'>{cellContent}</div>
                    {toggleWrapper}
                  </>
                )}
              </Flex>
            ) : (
              cellContent
            );

            return (
              <GenericTableCell
                data-testid={`${config.columnKey}-${rowIndex}`}
                mobileLabel={
                  colIndex === 0
                    ? undefined
                    : resolveTableColumnTitle(translate, config.titleKey, config.titleOverride)
                }
                align={config.columnAlignment ?? ColumnTypeToAlign[config.columnType]}
                colSpan={cellValue?.colSpan}
                key={config.columnKey}
                className={cellValue?.cellOverrideClassName}
                style={
                  cellValue
                    ? {
                        ...formatCellBackgroundStyle(cellValue, config, theme),
                        ...formatCellTextStyle(cellValue),
                        ...cellValue.cellOverrideStyle,
                      }
                    : undefined
                }>
                {contentWithOptionalToggle}
              </GenericTableCell>
            );
          })}
        </GenericTableRow>
      );

      if (!isRowExpanded || !expandedRowColumnsByColumn) {
        return [parentRow];
      }

      const expandedColumnEntries = unHiddenColumnConfigs.map((config) => {
        const expandedColumnDefinition = expandedRowColumnsByColumn[config.columnKey];
        if (!expandedColumnDefinition) {
          return {
            expandedColumnConfig: config,
            expandedCellSpecs: [],
          };
        }

        const expandedColumnConfig: TableColumnConfig<TColumnKey> = {
          ...config,
          ...expandedColumnDefinition.columnConfig,
          columnKey: config.columnKey,
        };
        if (expandedColumnConfig.hidden) {
          return {
            expandedColumnConfig,
            expandedCellSpecs: [],
          };
        }

        const expandedCellData = expandedColumnDefinition.getCellData(rowExpansionRenderParams);
        let expandedCellSpecs: GenericTableV2ExpandedRowCellSpec<TActionType, TActionOn>[] = [];
        if (Array.isArray(expandedCellData)) {
          expandedCellSpecs = expandedCellData.map((value) =>
            normalizeExpandedRowCellSpec<TActionType, TActionOn>(value),
          );
        } else if (expandedCellData !== undefined && expandedCellData !== null) {
          expandedCellSpecs = [
            normalizeExpandedRowCellSpec<TActionType, TActionOn>(expandedCellData),
          ];
        }
        return {
          expandedColumnConfig,
          expandedCellSpecs,
        };
      });

      const expandedRowCount = expandedColumnEntries.reduce(
        (count, entry) => Math.max(count, entry.expandedCellSpecs.length),
        0,
      );

      if (!expandedRowCount) {
        return [parentRow];
      }

      const expandedRows = Array.from({ length: expandedRowCount }).flatMap(
        (_, expandedRowIndex) => {
          const expandedRowKey = `${rowKey}-expanded-${expandedRowIndex}`;

          let hasExpandedCellContent = false;
          const expandedCells = expandedColumnEntries.map((entry, colIndex) => {
            const expandedCellSpec = entry.expandedCellSpecs[expandedRowIndex];
            if (expandedCellSpec?.skipCell) {
              return null;
            }
            const expandedCellValue = expandedCellSpec?.cellData;
            const hasExpandedCellValue =
              expandedCellValue !== undefined && expandedCellValue !== null;
            // Compact rows are rendered as label/value blocks. Avoid rendering empty blocks.
            if (isCompactView && !hasExpandedCellValue) {
              return null;
            }
            if (hasExpandedCellValue) {
              hasExpandedCellContent = true;
            }
            const expandedCellConfig =
              hasExpandedCellValue &&
              entry.expandedColumnConfig.columnType !== expandedCellValue.type
                ? {
                    ...entry.expandedColumnConfig,
                    columnType: expandedCellValue.type,
                  }
                : entry.expandedColumnConfig;

            const expandedCellView = hasExpandedCellValue
              ? formatCellContent(
                  expandedCellValue,
                  expandedCellConfig,
                  locale,
                  translate,
                  false,
                  isRowSelected,
                )
              : null;
            return (
              <GenericTableCell
                key={`${expandedRowKey}-${String(entry.expandedColumnConfig.columnKey)}`}
                mobileLabel={
                  colIndex === 0
                    ? undefined
                    : resolveTableColumnTitle(
                        translate,
                        entry.expandedColumnConfig.titleKey,
                        entry.expandedColumnConfig.titleOverride,
                      )
                }
                align={
                  expandedCellConfig.columnAlignment ??
                  ColumnTypeToAlign[expandedCellConfig.columnType]
                }
                colSpan={expandedCellSpec?.colSpan}
                style={{
                  ...(hasExpandedCellValue
                    ? formatCellBackgroundStyle(expandedCellValue, expandedCellConfig, theme)
                    : undefined),
                  ...(hasExpandedCellValue ? formatCellTextStyle(expandedCellValue) : undefined),
                }}>
                {expandedCellView}
              </GenericTableCell>
            );
          });

          if (!hasExpandedCellContent) {
            return [];
          }

          return (
            <GenericTableRow
              key={expandedRowKey}
              selected={isRowSelected}
              onMouseEnter={handleGroupMouseEnter}
              onMouseLeave={handleGroupMouseLeave}
              style={isGroupHovered ? { backgroundColor: theme.palette.states.hover } : undefined}>
              {expandedCells}
            </GenericTableRow>
          );
        },
      );

      return [parentRow, ...expandedRows];
    });
  }, [
    columnConfigs,
    effectiveParentRows,
    expandedRowColumnsByColumn,
    expandedRowKeySet,
    hasExpandedRowColumnsByColumn,
    hoveredParentKey,
    isCompactView,
    locale,
    rowExpansion,
    tableConfig?.hover,
    theme,
    toggleRowExpansion,
    translate,
    unHiddenColumnConfigs,
  ]);

  const summaryRowContent = useMemo(() => {
    if (!tableConfig?.firstDataRowIsSummary) {
      return undefined;
    }
    const summaryRowData = rowData.length ? rowData[0] : undefined;
    return unHiddenColumnConfigs.map((config) => {
      const cellValue = summaryRowData?.get(config.columnKey);
      return cellValue ? formatCellContent(cellValue, config, locale, translate, true) : '';
    });
  }, [locale, rowData, tableConfig?.firstDataRowIsSummary, translate, unHiddenColumnConfigs]);

  return (
    <Grid container item XSmall={12} direction='row'>
      {tableHeader && (
        <Grid item XSmall={12}>
          {tableHeader}
        </Grid>
      )}
      <TableContainer
        className={cx(
          {
            [tableContainerBorder]: tableConfig?.tableBorder ?? true,
            [tabbedTableContainer]: isInTabSwitchedContext,
          },
          classes?.tableContainer,
        )}>
        <Table
          className={cx(tableLayout, {
            [withColumnDivider]: !!tableConfig?.columnDivider,
            [stickyFirstCellInRow]: !!tableConfig?.stickyFirstColumn,
            [stickyLastCellInRow]: !!tableConfig?.stickyLastColumn,
          })}
          stickyHeader={!!tableConfig?.stickyHeader}>
          <GenericTableHeaderRows
            columnConfigs={unHiddenColumnConfigs}
            order={order}
            orderBy={orderBy}
            onSort={handleGenericSortOnClick}
            summaryRowContent={summaryRowContent}
            isDataLoading={otherProps.isDataLoading}
          />
          <GenericTableBodyWrapper
            isV2
            columns={unHiddenColumnConfigs.length}
            showNoDataMessage={showNoDataMessage ?? effectivePagination?.total === 0}
            emptyStateTableHeight={emptyStateTableHeight}
            {...otherProps}>
            {renderedRows}
          </GenericTableBodyWrapper>
        </Table>
      </TableContainer>
      {effectivePagination && (
        <Grid item XSmall={12} container justifyContent='flex-end'>
          <GenericTablePagination {...effectivePagination} />
        </Grid>
      )}
      {footer}
    </Grid>
  );
};

export default GenericTableV2;
