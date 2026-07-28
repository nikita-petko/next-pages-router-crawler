import type { CSSProperties, FC, ReactNode, Ref } from 'react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { Row } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressCircle,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import type {
  AdaptiveDataTableTextStyle,
  AdaptiveDataTableTextStyles,
} from './measureAdaptiveDataTableText';
import type {
  AdaptiveDataTableMenuCell,
  AdaptiveDataTableMenuItem,
  AdaptiveDataTableProps,
  AdaptiveDataTableRow,
  AdaptiveDataTableTooltipConfig,
  AdaptiveDataTableValueCell,
} from './types/AdaptiveDataTable';
import { useAdaptiveDataTable } from './useAdaptiveDataTable';

/* oxlint-disable react/react-compiler -- TanStack Table and Virtual return intentionally non-memoizable callbacks. */

const InfiniteViewportHeight = 480;
const InfiniteLoadDistance = 500;
const VirtualRowOverscan = 8;
const MinimumColumnSpan = 1;
const SmallScreenMediaQuery = '(max-width: 600px)';
const DefaultCellHorizontalPadding = 48;
const DefaultFontStyle = 'normal';
const DefaultFontVariant = 'normal';
const DefaultFontWeight = '400';
const NormalLetterSpacing = 'normal';

type AdaptiveDataTableSize = NonNullable<AdaptiveDataTableProps<AdaptiveDataTableRow>['size']>;
type TooltipTriggerKind = 'menu' | 'item';

const RowHeightBySize: Readonly<Record<AdaptiveDataTableSize, number>> = {
  XSmall: 32,
  Small: 48,
  Medium: 60,
};

const TruncatedCellClassName = 'text-truncate-end';
const PaginationClassName = 'flex items-center justify-end';
const PaginationContentClassName = 'flex items-center gap-large';
const PaginationPaddingClassNameBySize: Readonly<Record<AdaptiveDataTableSize, string>> = {
  XSmall: 'padding-x-small padding-y-xsmall',
  Small: 'padding-x-medium padding-y-small',
  Medium: 'padding-x-large padding-y-medium',
};
const PaginationTextClassNameBySize: Readonly<Record<AdaptiveDataTableSize, string>> = {
  XSmall: 'text-body-small',
  Small: 'text-body-small',
  Medium: 'text-body-medium',
};
const PaginationControlsClassNameBySize: Readonly<Record<AdaptiveDataTableSize, string>> = {
  XSmall: 'flex items-center gap-xsmall',
  Small: 'flex items-center gap-xsmall',
  Medium: 'flex items-center gap-small',
};
const PaginationButtonSizeByTableSize: Readonly<Record<AdaptiveDataTableSize, 'XSmall' | 'Small'>> =
  {
    XSmall: 'XSmall',
    Small: 'XSmall',
    Medium: 'Small',
  };
const MenuGroupClassName = 'padding-small';
const MenuTriggerTooltipClassName = 'inline-flex';
const MenuItemTooltipClassName = 'width-full';
const TooltipPositionByTriggerKind: Readonly<
  Record<TooltipTriggerKind, 'top-center' | 'left-center'>
> = {
  menu: 'top-center',
  item: 'left-center',
};

const ScrollContainerStyle: CSSProperties = {
  overflow: 'auto',
  position: 'relative',
  width: '100%',
};
const TableStyle: CSSProperties = { display: 'grid', width: '100%' };
const HeaderStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface-100)',
  display: 'grid',
  position: 'sticky',
  top: 0,
  zIndex: 3,
};
const BodyStyle: CSSProperties = { display: 'grid' };
const GridRowStyle: CSSProperties = { display: 'grid' };
const GridCellStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  minWidth: 0,
};
const GridCellJustificationByAlignment: Readonly<
  Record<'start' | 'center' | 'end', CSSProperties['justifyContent']>
> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};
const VirtualBodyStyle: CSSProperties = { display: 'block', position: 'relative' };
const VirtualRowStyle: CSSProperties = {
  display: 'grid',
  left: 0,
  position: 'absolute',
  top: 0,
  width: '100%',
};
const StateRowStyle: CSSProperties = { display: 'block', width: '100%' };
const VirtualStateRowStyle: CSSProperties = {
  display: 'block',
  left: 0,
  position: 'absolute',
  top: 0,
  width: '100%',
};
const StateCellStyle: CSSProperties = {
  alignItems: 'center',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  left: 0,
  minHeight: 'var(--size-1200)',
  position: 'sticky',
  width: '100%',
};
const TruncatedCellStyle: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
const WrappedCellStyle: CSSProperties = {
  overflowWrap: 'anywhere',
  whiteSpace: 'normal',
};
const UnbrokenCellStyle: CSSProperties = { whiteSpace: 'nowrap' };
const PinnedCellStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface-100)',
  borderRight: 'var(--stroke-thin) solid var(--color-stroke-muted)',
  left: 0,
  position: 'sticky',
  zIndex: 1,
};
const PinnedHeaderCellStyle: CSSProperties = { ...PinnedCellStyle, zIndex: 4 };
const FramedScrollContainerStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface-100)',
  borderColor: 'var(--color-stroke-default)',
  borderRadius: 'var(--radius-medium)',
  borderStyle: 'solid',
  borderWidth: 'var(--stroke-standard)',
  boxSizing: 'border-box',
};

const subscribeToSmallScreen = (onChange: () => void): (() => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }
  const mediaQuery = window.matchMedia(SmallScreenMediaQuery);
  mediaQuery.addEventListener('change', onChange);
  return () => mediaQuery.removeEventListener('change', onChange);
};

const getSmallScreenSnapshot = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(SmallScreenMediaQuery).matches;

const getServerSmallScreenSnapshot = (): boolean => false;

/**
 * TanStack's dynamic table example skips measurement in Firefox because
 * `getBoundingClientRect` includes the table border in each row's height there. The fixed
 * size estimate is more accurate than accumulating that border error across virtual rows.
 */
export const canMeasureVirtualRows = (userAgent: string | undefined): boolean =>
  !userAgent?.includes('Firefox');

const defaultDisplayString = (value: string | number | boolean): string => String(value);

const parsePixelValue = (value: string, fallback = 0): number => {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const getTextStyle = (element: HTMLTableCellElement): AdaptiveDataTableTextStyle | undefined => {
  const computedStyle = getComputedStyle(element);
  if (!computedStyle.fontFamily || !computedStyle.fontSize) {
    return undefined;
  }

  return {
    font: `${computedStyle.fontStyle || DefaultFontStyle} ${computedStyle.fontVariant || DefaultFontVariant} ${computedStyle.fontWeight || DefaultFontWeight} ${computedStyle.fontSize} ${computedStyle.fontFamily}`,
    horizontalPadding:
      parsePixelValue(computedStyle.paddingLeft) + parsePixelValue(computedStyle.paddingRight) ||
      DefaultCellHorizontalPadding,
    letterSpacing:
      computedStyle.letterSpacing === NormalLetterSpacing
        ? 0
        : parsePixelValue(computedStyle.letterSpacing),
  };
};

const areTextStylesEqual = (
  first: AdaptiveDataTableTextStyles | undefined,
  second: AdaptiveDataTableTextStyles,
): boolean =>
  first?.cell.font === second.cell.font &&
  first.cell.horizontalPadding === second.cell.horizontalPadding &&
  first.cell.letterSpacing === second.cell.letterSpacing &&
  first.header.font === second.header.font &&
  first.header.horizontalPadding === second.header.horizontalPadding &&
  first.header.letterSpacing === second.header.letterSpacing;

const withTooltip = (
  tooltip: AdaptiveDataTableTooltipConfig | undefined,
  child: ReactNode,
  triggerKind: TooltipTriggerKind,
): ReactNode => {
  if (!tooltip) {
    return child;
  }

  const trigger =
    triggerKind === 'menu' ? (
      <span className={MenuTriggerTooltipClassName}>{child}</span>
    ) : (
      <div className={MenuItemTooltipClassName}>{child}</div>
    );

  return (
    <Tooltip
      description={tooltip.description}
      position={TooltipPositionByTriggerKind[triggerKind]}
      title={tooltip.title}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
    </Tooltip>
  );
};

type MenuCellItemProps = {
  readonly item: AdaptiveDataTableMenuItem;
  readonly onClose: () => void;
};

type MenuSelectionEvent = {
  readonly preventDefault: () => void;
};

const MenuCellItem: FC<MenuCellItemProps> = ({ item, onClose }) => {
  const handleSelect = useCallback(
    (event?: MenuSelectionEvent) => {
      if (item.kind === 'link' && item.onSelect) {
        event?.preventDefault();
      }
      item.onSelect?.();
      onClose();
    },
    [item, onClose],
  );

  const menuItem =
    item.kind === 'link' ? (
      <MenuItem
        as='a'
        disabled={item.disabled}
        href={item.disabled ? undefined : item.href}
        leading={item.leading}
        onSelect={handleSelect}
        title={item.label}
        trailing={item.trailing}
        value={item.id}
      />
    ) : (
      <MenuItem
        disabled={item.disabled}
        leading={item.leading}
        onSelect={handleSelect}
        title={item.label}
        trailing={item.trailing}
        value={item.id}
      />
    );

  return <>{withTooltip(item.tooltip, menuItem, 'item')}</>;
};

type MenuCellProps = {
  readonly cell: AdaptiveDataTableMenuCell;
};

const MenuCell: FC<MenuCellProps> = ({ cell }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDisabled = cell.disabled === true || cell.items.length === 0;
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const handleOpenChange = useCallback(
    (nextIsOpen: boolean) => {
      if (!isDisabled) {
        setIsOpen(nextIsOpen);
      }
    },
    [isDisabled],
  );

  const trigger = (
    <PopoverTrigger asChild>
      <IconButton
        ariaLabel={cell.menuAriaLabel}
        icon='icon-filled-three-dots-vertical'
        isDisabled={isDisabled}
        size='Small'
        variant='Utility'
      />
    </PopoverTrigger>
  );

  return (
    <Popover open={!isDisabled && isOpen} onOpenChange={handleOpenChange}>
      {withTooltip(cell.tooltip, trigger, 'menu')}
      <PopoverContent align='end' ariaLabel={cell.menuAriaLabel} side='bottom'>
        <Menu size='Small'>
          <div className={MenuGroupClassName}>
            {cell.items.map((item) => (
              <MenuCellItem item={item} key={item.id} onClose={closeMenu} />
            ))}
          </div>
        </Menu>
      </PopoverContent>
    </Popover>
  );
};

const renderValueCell = (cell: AdaptiveDataTableValueCell) => {
  const displayString = (cell.displayString ?? defaultDisplayString)(cell.value);
  return cell.renderContainer?.({ children: displayString, value: cell.value }) ?? displayString;
};

type DataRowProps<TRow extends AdaptiveDataTableRow> = {
  readonly columnGrid: string;
  readonly row: Row<TRow>;
  readonly isSmallScreen: boolean;
  readonly isVirtual?: boolean;
  readonly measureElement?: (node: HTMLTableRowElement | null) => void;
  readonly measurementCellRef?: Ref<HTMLTableCellElement>;
  readonly minimumHeight: number;
  readonly transform?: string;
};

const DataRow = <TRow extends AdaptiveDataTableRow>({
  columnGrid,
  isSmallScreen,
  isVirtual = false,
  measureElement,
  measurementCellRef,
  minimumHeight,
  row,
  transform,
}: DataRowProps<TRow>) => {
  const visibleCells = row.getVisibleCells();
  const canRowWrap = visibleCells.some((cell) => {
    const cellConfig = row.original[cell.column.id];
    return (
      cellConfig.type === 'value' &&
      typeof cellConfig.value === 'string' &&
      cellConfig.textOverflow !== 'truncate'
    );
  });

  return (
    <TableRow
      data-index={row.index}
      ref={measureElement}
      style={{
        ...(isVirtual ? VirtualRowStyle : GridRowStyle),
        gridTemplateColumns: columnGrid,
        transform,
      }}>
      {visibleCells.map((cell, cellIndex) => {
        const cellConfig = row.original[cell.column.id];
        const alignment = cellConfig.align ?? (cellConfig.type === 'display' ? 'end' : 'start');
        const isStringValue = cellConfig.type === 'value' && typeof cellConfig.value === 'string';
        const shouldTruncate = isStringValue && cellConfig.textOverflow === 'truncate';
        const shouldWrap = isStringValue && !shouldTruncate;
        return (
          <TableCell
            align={alignment}
            className={shouldTruncate ? TruncatedCellClassName : undefined}
            key={cell.id}
            ref={cellIndex === 0 ? measurementCellRef : undefined}
            style={{
              ...GridCellStyle,
              ...(shouldWrap
                ? WrappedCellStyle
                : shouldTruncate
                  ? TruncatedCellStyle
                  : UnbrokenCellStyle),
              ...(canRowWrap ? { height: 'auto', minHeight: minimumHeight } : undefined),
              justifyContent: GridCellJustificationByAlignment[alignment],
              ...(isSmallScreen && cellIndex === 0 ? PinnedCellStyle : undefined),
            }}>
            {cellConfig.type === 'display' ? (
              <MenuCell cell={cellConfig} />
            ) : (
              renderValueCell(cellConfig)
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
};

type StateRowProps = {
  readonly cellStyle: CSSProperties;
  readonly children: ReactNode;
  readonly columnCount: number;
};

const StateRow: FC<StateRowProps> = ({ cellStyle, children, columnCount }) => (
  <TableRow style={StateRowStyle}>
    <TableCell align='center' colSpan={columnCount} style={cellStyle}>
      {children}
    </TableCell>
  </TableRow>
);

/**
 * An adaptive, server-driven data table backed internally by TanStack Table and
 * rendered with Foundation UI. Its public API intentionally does not expose
 * TanStack state or types.
 *
 * @experimental This API may change while pagination, sorting, and virtualization
 * behavior is validated with production datasets.
 * @deprecated EXPERIMENTAL: Do not use in production. To opt into evaluation,
 * explicitly disable the `typescript/no-deprecated` lint rule at the usage site.
 */
const AdaptiveDataTable = <TRow extends AdaptiveDataTableRow>({
  getRowId,
  isError = false,
  isLoading = false,
  labels,
  navigation,
  onSortChange,
  rows,
  size = 'Medium',
  sort,
  variant = 'Divided',
}: AdaptiveDataTableProps<TRow>) => {
  const isSmallScreen = useSyncExternalStore(
    subscribeToSmallScreen,
    getSmallScreenSnapshot,
    getServerSmallScreenSnapshot,
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerMeasurementRef = useRef<HTMLTableCellElement>(null);
  const cellMeasurementRef = useRef<HTMLTableCellElement>(null);
  const requestedCursorRef = useRef<string | null>(null);
  const previousSortRef = useRef(sort);
  const [scrollViewportWidth, setScrollViewportWidth] = useState<number>();
  const [textStyles, setTextStyles] = useState<AdaptiveDataTableTextStyles>();
  const { cellsByColumnId, columnBlueprints, columnLayout, table } = useAdaptiveDataTable({
    availableWidth: scrollViewportWidth,
    getRowId,
    onSortChange,
    rows,
    sort,
    textStyles,
  });
  const tableRows = table.getRowModel().rows;
  const hasWrappingColumn = columnBlueprints.some(
    (blueprint) =>
      blueprint.cell.type === 'value' &&
      typeof blueprint.cell.value === 'string' &&
      blueprint.cell.textOverflow !== 'truncate',
  );
  const isInfinite = navigation.mode === 'infinite';
  const isTableError = isError && tableRows.length === 0;
  const shouldFrameScrollContainer = variant === 'Framed' && (isInfinite || isSmallScreen);
  const isLoadMoreError = navigation.mode === 'infinite' && navigation.isLoadMoreError === true;
  const virtualCount = isInfinite
    ? tableRows.length + (navigation.isLoadingMore || isLoadMoreError ? 1 : 0)
    : tableRows.length;
  const rowVirtualizer = useVirtualizer({
    count: virtualCount,
    estimateSize: () => RowHeightBySize[size],
    getScrollElement: () => scrollContainerRef.current,
    overscan: VirtualRowOverscan,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const infiniteNextCursor = navigation.mode === 'infinite' ? navigation.nextCursor : null;
  const isLoadingMore = navigation.mode === 'infinite' && navigation.isLoadingMore === true;
  const onLoadMore = navigation.mode === 'infinite' ? navigation.onLoadMore : undefined;

  useEffect(() => {
    let isCancelled = false;
    const updateTextStyles = () => {
      if (isCancelled || !headerMeasurementRef.current || !cellMeasurementRef.current) {
        return;
      }
      const headerStyle = getTextStyle(headerMeasurementRef.current);
      const cellStyle = getTextStyle(cellMeasurementRef.current);
      if (!headerStyle || !cellStyle) {
        return;
      }
      const nextTextStyles = { cell: cellStyle, header: headerStyle };
      setTextStyles((currentTextStyles) =>
        areTextStylesEqual(currentTextStyles, nextTextStyles) ? currentTextStyles : nextTextStyles,
      );
    };

    const fontSet = typeof document === 'undefined' ? undefined : document.fonts;
    if (fontSet?.status === 'loading') {
      void fontSet.ready.then(updateTextStyles);
    } else {
      updateTextStyles();
    }

    return () => {
      isCancelled = true;
    };
  }, [rows.length, size, virtualRows.length]);

  const loadMoreIfNeeded = useCallback(
    (scrollContainer: HTMLDivElement | null) => {
      if (
        !scrollContainer ||
        !onLoadMore ||
        isLoading ||
        isTableError ||
        isLoadingMore ||
        isLoadMoreError ||
        infiniteNextCursor === null ||
        requestedCursorRef.current === infiniteNextCursor
      ) {
        return;
      }

      const distanceFromBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
      if (distanceFromBottom >= InfiniteLoadDistance) {
        return;
      }

      requestedCursorRef.current = infiniteNextCursor;
      onLoadMore(infiniteNextCursor);
    },
    [infiniteNextCursor, isLoadMoreError, isLoading, isLoadingMore, isTableError, onLoadMore],
  );

  const handleInfiniteScroll = useCallback(() => {
    loadMoreIfNeeded(scrollContainerRef.current);
  }, [loadMoreIfNeeded]);

  const handleRetryLoadMore = useCallback(() => {
    if (!onLoadMore || infiniteNextCursor === null || isLoadingMore) {
      return;
    }
    requestedCursorRef.current = infiniteNextCursor;
    onLoadMore(infiniteNextCursor);
  }, [infiniteNextCursor, isLoadingMore, onLoadMore]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      return undefined;
    }
    const updateViewportWidth = () => {
      setScrollViewportWidth(scrollContainer.clientWidth || undefined);
    };
    updateViewportWidth();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const resizeObserver = new ResizeObserver(updateViewportWidth);
    resizeObserver.observe(scrollContainer);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const previousSort = previousSortRef.current;
    const didSortChange =
      previousSort?.columnId !== sort?.columnId || previousSort?.direction !== sort?.direction;
    previousSortRef.current = sort;

    if (!didSortChange) {
      return;
    }

    requestedCursorRef.current = null;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [sort]);

  useEffect(() => {
    if (requestedCursorRef.current !== null && requestedCursorRef.current !== infiniteNextCursor) {
      requestedCursorRef.current = null;
    }
    loadMoreIfNeeded(scrollContainerRef.current);
  }, [infiniteNextCursor, isLoadingMore, loadMoreIfNeeded, tableRows.length]);

  const headerGroups = table.getHeaderGroups();
  const scrollStyle = useMemo(
    () => ({
      ...ScrollContainerStyle,
      ...(shouldFrameScrollContainer ? FramedScrollContainerStyle : undefined),
      ...(isInfinite ? { height: InfiniteViewportHeight } : undefined),
    }),
    [isInfinite, shouldFrameScrollContainer],
  );
  const tableStyle = useMemo(
    () => ({ ...TableStyle, minWidth: columnLayout.tableWidth }),
    [columnLayout.tableWidth],
  );
  const headerRowStyle = useMemo(
    () => ({ ...GridRowStyle, gridTemplateColumns: columnLayout.gridTemplateColumns }),
    [columnLayout.gridTemplateColumns],
  );
  const stateCellStyle = useMemo(
    () => ({ ...StateCellStyle, width: scrollViewportWidth ?? '100%' }),
    [scrollViewportWidth],
  );

  const renderState = () => {
    if (isTableError) {
      return labels.error;
    }
    if (isLoading && tableRows.length === 0) {
      return <ProgressCircle ariaLabel={labels.loading} size='Medium' />;
    }
    if (tableRows.length === 0) {
      return labels.emptyState;
    }
    return undefined;
  };
  const state = renderState();
  const columnCount = Math.max(columnBlueprints.length, MinimumColumnSpan);

  return (
    <div>
      <div
        onScroll={navigation.mode === 'infinite' ? handleInfiniteScroll : undefined}
        ref={scrollContainerRef}
        style={scrollStyle}>
        <div style={tableStyle}>
          <Table
            size={size}
            style={TableStyle}
            variant={shouldFrameScrollContainer ? 'Divided' : variant}>
            <TableHeader style={HeaderStyle}>
              {headerGroups.map((headerGroup) => (
                <TableRow key={headerGroup.id} style={headerRowStyle}>
                  {headerGroup.headers.map((header, headerIndex) => {
                    const cell = cellsByColumnId.get(header.column.id);
                    if (!cell) {
                      return null;
                    }
                    const sortDirection = header.column.getIsSorted();
                    return (
                      <TableHeaderCell
                        align={cell.align ?? (cell.type === 'display' ? 'end' : 'start')}
                        key={header.id}
                        ref={headerIndex === 0 ? headerMeasurementRef : undefined}
                        onSort={
                          header.column.getCanSort()
                            ? () => header.column.toggleSorting()
                            : undefined
                        }
                        sortDirection={
                          sortDirection === 'asc'
                            ? 'ascending'
                            : sortDirection === 'desc'
                              ? 'descending'
                              : 'none'
                        }
                        sortLabel={cell.type === 'value' ? cell.sortAriaLabel : undefined}
                        style={
                          isSmallScreen && headerIndex === 0 ? PinnedHeaderCellStyle : undefined
                        }>
                        {cell.header ?? ''}
                      </TableHeaderCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            {state !== undefined ? (
              <TableBody style={BodyStyle}>
                <StateRow cellStyle={stateCellStyle} columnCount={columnCount}>
                  {state}
                </StateRow>
              </TableBody>
            ) : isInfinite ? (
              <TableBody style={{ ...VirtualBodyStyle, height: rowVirtualizer.getTotalSize() }}>
                {virtualRows.map((virtualRow, virtualRowIndex) => {
                  const row = tableRows[virtualRow.index];
                  if (!row) {
                    const showLoadMoreError = isLoadMoreError && !isLoadingMore;
                    return (
                      <TableRow
                        key={showLoadMoreError ? 'load-more-error' : 'loading-more'}
                        style={{
                          ...VirtualStateRowStyle,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}>
                        <TableCell align='center' colSpan={columnCount} style={stateCellStyle}>
                          {showLoadMoreError ? (
                            <div className='flex items-center gap-small'>
                              <span>{labels.error}</span>
                              <Button onClick={handleRetryLoadMore} size='Small' variant='Standard'>
                                {labels.retry}
                              </Button>
                            </div>
                          ) : (
                            <ProgressCircle ariaLabel={labels.loading} size='Small' />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <DataRow
                      columnGrid={columnLayout.gridTemplateColumns}
                      isSmallScreen={isSmallScreen}
                      isVirtual
                      key={row.id}
                      measureElement={
                        hasWrappingColumn ||
                        canMeasureVirtualRows(
                          typeof navigator === 'undefined' ? undefined : navigator.userAgent,
                        )
                          ? rowVirtualizer.measureElement
                          : undefined
                      }
                      measurementCellRef={virtualRowIndex === 0 ? cellMeasurementRef : undefined}
                      minimumHeight={RowHeightBySize[size]}
                      row={row}
                      transform={`translateY(${virtualRow.start}px)`}
                    />
                  );
                })}
              </TableBody>
            ) : (
              <TableBody style={BodyStyle}>
                {tableRows.map((row, rowIndex) => (
                  <DataRow
                    columnGrid={columnLayout.gridTemplateColumns}
                    isSmallScreen={isSmallScreen}
                    key={row.id}
                    measurementCellRef={rowIndex === 0 ? cellMeasurementRef : undefined}
                    minimumHeight={RowHeightBySize[size]}
                    row={row}
                  />
                ))}
              </TableBody>
            )}
          </Table>
        </div>
      </div>
      {navigation.mode === 'pagination' ? (
        <div className={`${PaginationClassName} ${PaginationPaddingClassNameBySize[size]}`}>
          <div className={PaginationContentClassName}>
            <span className={`${PaginationTextClassNameBySize[size]} content-default`}>
              {labels.page(navigation.pageIndex, navigation.pageSize, navigation.totalRowCount)}
            </span>
            <div className={PaginationControlsClassNameBySize[size]}>
              <IconButton
                ariaLabel={labels.previousPage}
                icon='icon-regular-chevron-small-left'
                isDisabled={!navigation.hasPreviousPage || isLoading}
                onClick={navigation.onPreviousPage}
                size={PaginationButtonSizeByTableSize[size]}
                variant='Utility'
              />
              <IconButton
                ariaLabel={labels.nextPage}
                icon='icon-regular-chevron-small-right'
                isDisabled={navigation.nextCursor === null || isLoading}
                onClick={() => {
                  if (navigation.nextCursor !== null) {
                    navigation.onNextPage(navigation.nextCursor);
                  }
                }}
                size={PaginationButtonSizeByTableSize[size]}
                variant='Utility'
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// oxlint-disable-next-line typescript/no-deprecated -- This module defines the experimental export.
export default AdaptiveDataTable;
