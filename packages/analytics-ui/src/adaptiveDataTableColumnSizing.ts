import {
  measureAdaptiveDataTableText,
  type AdaptiveDataTableTextStyle,
  type AdaptiveDataTableTextStyles,
} from './measureAdaptiveDataTableText';
import type {
  AdaptiveDataTableCell,
  AdaptiveDataTablePrimitive,
  AdaptiveDataTableRow,
} from './types/AdaptiveDataTable';

const MenuColumnWidth = 96;
const MinimumValueColumnWidth = 128;
const MaximumPreferredStringColumnWidth = 640;
const ApproximateCharacterWidth = 8;
const DefaultCellHorizontalPadding = 48;
const SortableHeaderChromeWidth = 24;
const EmptyGridTemplateColumns = 'minmax(100%, 1fr)';

export type AdaptiveDataTableColumnLayout = {
  readonly gridTemplateColumns: string;
  readonly tableWidth: number;
};

export type AdaptiveDataTableColumnBlueprint = {
  readonly id: string;
  readonly cell: AdaptiveDataTableCell;
};

type MeasuredColumn = {
  readonly isString: boolean;
  readonly minimumWidth: number;
  readonly preferredWidth: number;
};

type ColumnSizingOptions<TRow extends AdaptiveDataTableRow> = {
  readonly availableWidth?: number;
  readonly columns: readonly AdaptiveDataTableColumnBlueprint[];
  readonly isSortingEnabled: boolean;
  readonly rows: readonly TRow[];
  readonly textStyles?: AdaptiveDataTableTextStyles;
};

const defaultDisplayString = (value: AdaptiveDataTablePrimitive): string => String(value);

const measureText = (text: string, style: AdaptiveDataTableTextStyle | undefined): number =>
  (style ? measureAdaptiveDataTableText(text, style) : undefined) ??
  text.length * ApproximateCharacterWidth;

const measureColumn = <TRow extends AdaptiveDataTableRow>(
  column: AdaptiveDataTableColumnBlueprint,
  rows: readonly TRow[],
  isSortingEnabled: boolean,
  textStyles: AdaptiveDataTableTextStyles | undefined,
): MeasuredColumn => {
  const headerText = typeof column.cell.header === 'string' ? column.cell.header : '';
  const headerWidth =
    measureText(headerText, textStyles?.header) +
    (textStyles?.header.horizontalPadding ?? DefaultCellHorizontalPadding) +
    (isSortingEnabled && column.cell.type === 'value' && column.cell.sortable !== false
      ? SortableHeaderChromeWidth
      : 0);

  if (column.cell.type === 'display') {
    const width = Math.max(MenuColumnWidth, Math.ceil(headerWidth));
    return { isString: false, minimumWidth: width, preferredWidth: width };
  }

  const valueWidth = rows.reduce((longestWidth, row) => {
    const cell = row[column.id];
    if (cell.type === 'display') {
      return longestWidth;
    }
    const displayString = cell.displayString ?? defaultDisplayString;
    return Math.max(longestWidth, measureText(displayString(cell.value), textStyles?.cell));
  }, 0);
  const contentWidth = Math.ceil(
    Math.max(
      headerWidth,
      valueWidth + (textStyles?.cell.horizontalPadding ?? DefaultCellHorizontalPadding),
    ),
  );
  const isString = typeof column.cell.value === 'string';
  const intrinsicWidth = Math.max(MinimumValueColumnWidth, contentWidth);

  if (!isString) {
    return { isString, minimumWidth: intrinsicWidth, preferredWidth: intrinsicWidth };
  }

  const preferredWidth = Math.min(MaximumPreferredStringColumnWidth, intrinsicWidth);
  return {
    isString,
    minimumWidth: MinimumValueColumnWidth,
    preferredWidth,
  };
};

/**
 * Reserves display, boolean, and number widths first, then gives each string column its
 * measured width from left to right while preserving the minimums of later string columns.
 * Surplus width goes to the rightmost string, or the final column when no string exists.
 */
const allocateColumnWidths = (
  columns: readonly MeasuredColumn[],
  availableWidth: number | undefined,
): readonly number[] => {
  const preferredTableWidth = columns.reduce((total, column) => total + column.preferredWidth, 0);
  if (!availableWidth) {
    return columns.map((column) => column.preferredWidth);
  }

  if (availableWidth >= preferredTableWidth) {
    const widths = columns.map((column) => column.preferredWidth);
    let fillColumnIndex = columns.length - 1;
    for (let index = columns.length - 1; index >= 0; index -= 1) {
      if (columns[index]?.isString) {
        fillColumnIndex = index;
        break;
      }
    }
    if (fillColumnIndex >= 0) {
      widths[fillColumnIndex] += availableWidth - preferredTableWidth;
    }
    return widths;
  }

  const minimumTableWidth = columns.reduce((total, column) => total + column.minimumWidth, 0);
  const widthToAllocate = Math.max(availableWidth, minimumTableWidth);
  const fixedWidth = columns.reduce(
    (total, column) => total + (column.isString ? 0 : column.preferredWidth),
    0,
  );
  let laterStringMinimumWidth = columns.reduce(
    (total, column) => total + (column.isString ? column.minimumWidth : 0),
    0,
  );
  let remainingWidth = widthToAllocate - fixedWidth;
  return columns.map((column) => {
    if (!column.isString) {
      return column.preferredWidth;
    }
    laterStringMinimumWidth -= column.minimumWidth;
    const width = Math.min(
      column.preferredWidth,
      Math.max(column.minimumWidth, remainingWidth - laterStringMinimumWidth),
    );
    remainingWidth -= width;
    return width;
  });
};

/**
 * Decides column widths in source order from the header and sampled formatted display strings.
 * Pretext measures strings with Foundation's computed font and letter spacing; the character
 * estimate is used only before those styles are available or when Canvas is unsupported.
 * Display controls reserve their known control/header width, while booleans and numbers keep the
 * full measured width of their display strings. Strings receive the remaining viewport width from
 * left to right, between a 128px minimum and a 640px content-preferred width, while preserving the
 * minimums of later strings. If the minimums do not fit, the table becomes horizontally
 * scrollable. If space remains after every preferred width is satisfied, the rightmost string (or
 * final column) expands so the table stays 100% wide.
 */
export const getAdaptiveDataTableColumnLayout = <TRow extends AdaptiveDataTableRow>({
  availableWidth,
  columns,
  isSortingEnabled,
  rows,
  textStyles,
}: ColumnSizingOptions<TRow>): AdaptiveDataTableColumnLayout => {
  const measuredColumns = columns.map((column) =>
    measureColumn(column, rows, isSortingEnabled, textStyles),
  );
  const widths = allocateColumnWidths(measuredColumns, availableWidth);

  return {
    gridTemplateColumns:
      widths.length === 0
        ? EmptyGridTemplateColumns
        : widths.map((width) => `${width}px`).join(' '),
    tableWidth: widths.reduce((total, width) => total + width, 0),
  };
};
