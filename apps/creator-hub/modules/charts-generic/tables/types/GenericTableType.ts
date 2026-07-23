import React, { ReactNode } from 'react';
import { TIconProps, TTypographyProps } from '@rbx/ui';
import type { TBadgeVariant } from '@rbx/foundation-ui';
import { Action } from '../../types/Action';
import { ComparisonChipSpec } from '../../charts/ComparisonChip';
import { FormattingSpec } from '../../components/MetricValue/MetricValue';
import { CellBackground, ColumnType, TSelection, TableColumnConfig } from './GenericColumnType';
import { GenericTablePaginationSpec } from '../GenericTablePagination';
import CodeEditorSupportedLanguages from '../../components/CodeEditors/CodeEditorSupportedLanguages';
import { TFormattingSpec } from '../../charts/numberFormatters';

export type TableConfig<TColumnKey> = {
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  stickyLastColumn?: boolean;
  columnDivider?: boolean;
  hover?: boolean;
  defaultActiveSort?: TColumnKey;
  tableBorder?: boolean;

  // if true, the first row of rowData will be treated as a summary row
  firstDataRowIsSummary?: boolean;
};

export enum Status {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Disabled = 'disabled',
}

export type TIconStatus = {
  chipType: 'icon';
  preset: Status;
  label: string;
};

export type TDotStatus = {
  chipType: 'dot';
  color: Exclude<TTypographyProps['color'], 'inherit' | 'disabled'> & string;
  label: string;
};

export type TBadgeStatus = {
  chipType: 'badge';
  variant: TBadgeVariant;
  label: string;
};

export type TStatus = TIconStatus | TDotStatus | TBadgeStatus;

type BaseCellType = {
  type: ColumnType;
};

type TextCellType = BaseCellType & {
  type: ColumnType.Text;
  value: string;
  fontFamily?: string;
  /** When true, limit text content to one line with trailing ellipsis */
  truncated?: boolean;
};

type BoldTextCellType = BaseCellType & {
  type: ColumnType.BoldText;
  value: string;
};

type NumberCellType = BaseCellType & {
  type: ColumnType.Number;
  value: number;
  // if provided, it overrides formatting spec from column config
  /**
   * @deprecated Use analyticsFormattingSpec instead. Will be removed in DSA-4660.
   */
  formattingSpec?: FormattingSpec;
  analyticsFormattingSpec?: TFormattingSpec;
  // if provided, it overrides cell background from column config
  cellBackground?: CellBackground;
  comparisonChipSpec?: ComparisonChipSpec;
};

type DateCellType = BaseCellType & {
  type: ColumnType.Date;
  value: Date;
};

type TimestampCellType = BaseCellType & {
  type: ColumnType.Timestamp;
  value: string | number | Date;
  format?: Intl.DateTimeFormatOptions;
};

type RawJSONStringCellType = BaseCellType & {
  type: ColumnType.RawJSONString;
  value: string;
};

type TextWithTooltipCellType = BaseCellType & {
  type: ColumnType.TextWithTooltip;
  text: string;
  tooltip?: string;
  Icon?: React.FunctionComponent<React.PropsWithChildren<TIconProps>>;
};

type TextWithDisplayValueCellType = BaseCellType & {
  type: ColumnType.TextWithDisplayValue;
  value: string;
  displayValue?: string;
};

type TextWithLinkCellType = BaseCellType & {
  type: ColumnType.TextWithLink;
  text: string;
  href: string;
  newTab: boolean;
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
};

type OtherCellType = BaseCellType & {
  type: ColumnType.Other;
  value: ReactNode;
};

type SelectionCellType = BaseCellType & {
  type: ColumnType.Selection;
} & TSelection;

export const TableActionColors = ['primary', 'error', 'info', 'success', 'warning'] as const;
export type TTableActionColor = (typeof TableActionColors)[number];

export type ActionCellAction<ActionType extends string, ActionOn = string> = Action<
  ActionType,
  ActionOn
> & {
  tooltipLabel?: string;
  /** render mode in a non-compact table, action is aways rendered as 'menu-item' when table is in compact mode
   * - 'dedicated-button': Renders as a dedicated button
   * - 'menu-item': Renders as a menu item as one of the dropdown menu options
   */
  renderedAsInNonCompactTable: 'dedicated-button' | 'menu-item';
  color?: TTableActionColor;
  /** Optional href to make the action behave as a link (supports middle-click to open in new tab).
   * When provided, the button or menu item will be wrapped in a Link component.
   */
  href?: string;
} & (
    | {
        renderedAsInNonCompactTable: 'dedicated-button';
        Icon?: React.FunctionComponent<React.PropsWithChildren<TIconProps>>;
        displayLabel: string;
        alwaysVisible?: boolean;
      }
    | {
        renderedAsInNonCompactTable: 'menu-item';
        displayLabel: string;
      }
  );

export type ActionCellType<ActionType extends string, ActionOn = string> = BaseCellType & {
  type: ColumnType.Actions;
  actions: ActionCellAction<ActionType, ActionOn>[];
};

type ImageCellType = BaseCellType & {
  type: ColumnType.Image;
  src: string;
  displayTextForSummaryRow?: string;
  width?: number;
  height?: number;
  onClick?: () => void;
  // custom data-id attribute, not shown in the UI
  dataId?: string;
  description?: string;
  // Optional text to display alongside the image
  text?: string;
  // Optional link for the text (not the image)
  link?: string;
};

type StatusCellType = BaseCellType & {
  type: ColumnType.Status;
} & TStatus;

type TextWithIconType = BaseCellType & {
  type: ColumnType.TextWithIcon;
  value: string;
  tooltip?: { message?: string; severity: 'error' | 'warning' };
  fontFamily?: string;
  /** When true, limit text content to one line with trailing ellipsis */
  truncated?: boolean;
};

type CodeCellType = BaseCellType & {
  type: ColumnType.Code;
  value: string;
  language?: CodeEditorSupportedLanguages;
  useMonoFont?: boolean;
  tooltip?: { message?: string; severity: 'error' | 'warning' };
  /** Defaults to inline. Use editor to render full read-only CodeEditor. */
  renderMode?: 'inline' | 'editor';
  /** When renderMode is editor, renders in diff context styling. */
  isInDiffContext?: boolean;
};

type CodeDiffCellType = BaseCellType & {
  type: ColumnType.CodeDiff;
  original?: string;
  modified?: string;
  language?: CodeEditorSupportedLanguages;
};

export type TableValueTypes<ActionType extends string = string, ActionOn = string> = {
  [ColumnType.BoldText]: BoldTextCellType;
  [ColumnType.Text]: TextCellType;
  [ColumnType.Number]: NumberCellType;
  [ColumnType.Date]: DateCellType;
  [ColumnType.Timestamp]: TimestampCellType;
  [ColumnType.RawJSONString]: RawJSONStringCellType;
  [ColumnType.TextWithTooltip]: TextWithTooltipCellType;
  [ColumnType.TextWithDisplayValue]: TextWithDisplayValueCellType;
  [ColumnType.TextWithLink]: TextWithLinkCellType;
  [ColumnType.Other]: OtherCellType;
  [ColumnType.Selection]: SelectionCellType;
  [ColumnType.Actions]: ActionCellType<ActionType, ActionOn>;
  [ColumnType.Image]: ImageCellType;
  [ColumnType.Status]: StatusCellType;
  [ColumnType.TextWithIcon]: TextWithIconType;
  [ColumnType.Code]: CodeCellType;
  [ColumnType.CodeDiff]: CodeDiffCellType;
};

export type CellDataType<ActionType extends string = string, ActionOn = string> = TableValueTypes<
  ActionType,
  ActionOn
>[ColumnType];

export type GenericTableV2RowExpansionRenderParams<
  TColumnKey extends string | number,
  ActionType extends string = string,
  TActionOn = string,
> = {
  rowInfo: Map<TColumnKey, CellDataType<ActionType, TActionOn>>;
  rowIndex: number;
  rowKey: string;
  isExpanded: boolean;
  isCompactView: boolean;
  toggleRowExpansion: () => void;
  columnConfigs: TableColumnConfig<TColumnKey>[];
  columnCount: number;
};

export type GenericTableV2ExpandedRowColumnConfig<TColumnKey extends string | number> = Omit<
  TableColumnConfig<TColumnKey>,
  'columnKey' | 'sort' | 'selection' | 'titleKey'
> & {
  titleKey?: TableColumnConfig<TColumnKey>['titleKey'];
};

export type GenericTableV2ExpandedRowColumnDefinition<
  TColumnKey extends string | number,
  ActionType extends string = string,
  TActionOn = string,
> = {
  columnConfig: GenericTableV2ExpandedRowColumnConfig<TColumnKey>;
  getCellData: (
    params: GenericTableV2RowExpansionRenderParams<TColumnKey, ActionType, TActionOn>,
  ) =>
    | GenericTableV2ExpandedRowCellSpec<ActionType, TActionOn>
    | GenericTableV2ExpandedRowCellSpec<ActionType, TActionOn>[]
    | CellDataType<ActionType, TActionOn>
    | (CellDataType<ActionType, TActionOn> | null | undefined)[]
    | null
    | undefined;
};

export type GenericTableV2ExpandedRowCellSpec<
  ActionType extends string = string,
  TActionOn = string,
> = {
  cellData?: CellDataType<ActionType, TActionOn> | null;
  colSpan?: number;
  /** Skip rendering this cell (useful when another cell spans across this column). */
  skipCell?: boolean;
};

export type GenericTableV2ExpandedRowColumnsByColumn<
  TColumnKey extends string | number,
  ActionType extends string = string,
  TActionOn = string,
> = Partial<
  Record<TColumnKey, GenericTableV2ExpandedRowColumnDefinition<TColumnKey, ActionType, TActionOn>>
>;

export type GenericTableV2RowExpansionConfig<
  TColumnKey extends string | number,
  ActionType extends string = string,
  TActionOn = string,
> = {
  /** Define expanded-row columns. Omitted columns are skipped. */
  expandedRowColumnsByColumn: GenericTableV2ExpandedRowColumnsByColumn<
    TColumnKey,
    ActionType,
    TActionOn
  >;
  /** When omitted, all rows are expandable */
  isRowExpandable?: (
    rowInfo: Map<TColumnKey, CellDataType<ActionType, TActionOn>>,
    index: number,
  ) => boolean;
  /** Controlled row expansion keys */
  expandedRowKeys?: string[];
  /** Uncontrolled initial row expansion keys */
  defaultExpandedRowKeys?: string[];
  /** Called whenever expanded row keys are updated */
  onExpandedRowKeysChange?: (expandedRowKeys: string[]) => void;
  /** Defaults to true. When false, only one row can be expanded at a time */
  allowMultipleExpandedRows?: boolean;
  /** Defaults to false. Click on row toggles expansion */
  expandOnRowClick?: boolean;
  /** Defaults to true. Prepends an expander toggle in the first visible cell */
  showToggleInFirstCell?: boolean;
};
export type GenericTableV2Config<
  TColumnKey extends string | number,
  ActionType extends string = string,
  TActionOn = string,
> = {
  rowData: Map<TColumnKey, CellDataType<ActionType, TActionOn>>[];
  columnConfigs: TableColumnConfig<TColumnKey>[];
  tableHeader?: React.JSX.Element;
  pagination?: GenericTablePaginationSpec | null;
  showNoDataMessage?: boolean;
  tableConfig?: TableConfig<TColumnKey>;
  getRowKey?: (
    rowInfo: Map<TColumnKey, CellDataType<ActionType, TActionOn>>,
    index: number,
  ) => string;
  rowRange?: {
    start: number;
    end: number;
  };
  getIsRowSelected?: (
    rowInfo: Map<TColumnKey, CellDataType<ActionType, TActionOn>>,
    index: number,
  ) => boolean;
  rowExpansion?: GenericTableV2RowExpansionConfig<TColumnKey, ActionType, TActionOn>;
};
