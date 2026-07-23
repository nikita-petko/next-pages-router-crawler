import { TTableCellProps } from '@rbx/ui';
import { FormattedText, TranslationKey } from '@modules/analytics-translations';
import { TableCellBackgroundColor } from '../../charts/options';
import { FormattingSpec } from '../../components/MetricValue/MetricValue';
import { TableSort } from './TableSort';
import { TFormattingSpec } from '../../charts/numberFormatters';

export enum ColumnType {
  BoldText = 'boldText',
  Text = 'text',
  TextWithDisplayValue = 'textWithDisplayValue',
  Number = 'number',
  Timestamp = 'timestamp',
  RawJSONString = 'RawJSONString',
  CodeDiff = 'codeDiff',
  TextWithTooltip = 'textWithTooltip',
  Other = 'other',
  Selection = 'selection',
  Actions = 'actions',
  TextWithLink = 'textWithLink',
  Image = 'image',
  Date = 'date',
  Status = 'status',
  TextWithIcon = 'TextWithIcon',
  Code = 'code',
}

export const ColumnTypeToAlign: Record<ColumnType, TTableCellProps['align']> = {
  [ColumnType.BoldText]: 'left',
  [ColumnType.Text]: 'left',
  [ColumnType.TextWithDisplayValue]: 'left',
  [ColumnType.Number]: 'right',
  [ColumnType.Other]: 'left',
  [ColumnType.Timestamp]: 'left',
  [ColumnType.RawJSONString]: 'left',
  [ColumnType.CodeDiff]: 'left',
  [ColumnType.TextWithTooltip]: 'left',
  [ColumnType.Selection]: 'center',
  [ColumnType.Actions]: 'center',
  [ColumnType.TextWithLink]: 'left',
  [ColumnType.Image]: 'left',
  [ColumnType.Date]: 'left',
  [ColumnType.Status]: 'left',
  [ColumnType.TextWithIcon]: 'left',
  [ColumnType.Code]: 'left',
};

export enum CellBackgroundType {
  ValueOpacityFill = 'valueOpacityFill',
  ValuePercentageWidthFill = 'valuePercentageWidthFill',
  ConstantFill = 'constantFill',
}

export type TSelection = {
  rowKey: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (rowKey: string, checked: boolean) => void;
  tooltip?: string;
};

type TableRowSelection = {
  headerCellSelectionData?: TSelection;
};

export type CellBackground = {
  type: CellBackgroundType;
  color: TableCellBackgroundColor;
  // When provided, any number >= this value maps to 100% opacity
  // cell value < it get scaled to an opacity number: value / fullOpacityScale
  fullOpacityScale?: number;
};

export type TableColumnConfig<TColumnKey> = {
  columnType: ColumnType;
  columnKey: TColumnKey;
  titleKey: TranslationKey | FormattedText;
  /** When provided, it overrides titleKey as the column header */
  titleOverride?: string;
  tooltipKey?: TranslationKey;
  sort?: TableSort<TColumnKey>;
  selection?: TableRowSelection;
  widthWeight?: number;
  /**
   * @deprecated Use analyticsNumberFormattingSpec instead. Will be removed in DSA-4660.
   */
  numericFormattingSpec?: FormattingSpec;
  analyticsNumberFormattingSpec?: TFormattingSpec;
  cellBackground?: CellBackground;
  headerBackground?: {
    type: CellBackgroundType.ConstantFill;
    color: TableCellBackgroundColor;
  };
  hidden?: boolean;

  /** When provided, it combines cells from current column and referenced column
   * on each row into a single cell in compact view. Rendering current cell content
   * followed by referenced cell content.
   *
   * i.e. [Image Column] [Option Menu Column]
   * where Image Column is current column and Option Menu Column is referenced column.
   * Image Column has endAdormentColumnKeyInCompactView = Option Menu Column Key
   * Cell will render [Image, Option Menu]
   *
   * This is useful when you want to combine columns for mobile view,
   * such as in our PersonalizedThumbnailsTable.
   */
  endAdormentColumnKeyInCompactView?: TColumnKey;

  // When specified, it will override column type alignment
  columnAlignment?: TTableCellProps['align'];
};

export type TableColumnConfigWithoutSort<TColumnKey> = TableColumnConfig<TColumnKey> & {
  sort?: never;
};

export const resolveTableColumnTitle = (
  translate: (key: TranslationKey) => FormattedText,
  title: TableColumnConfig<string | number>['titleKey'],
  titleOverride?: TableColumnConfig<string | number>['titleOverride'],
): FormattedText => {
  if (titleOverride !== undefined) {
    // titleOverride is already user-facing display text.
    return titleOverride as FormattedText;
  }
  return typeof title === 'string' ? title : translate(title);
};
