import type { TTheme } from '@rbx/ui';
import { getTableCellBackgroundRgbTuple } from '../charts/options';
import { ChartUnit } from '../charts/types/ChartTypes';
import formatProgressionLinearGradient from '../utils/formatProgressionLinearGradient';
import type { TableColumnConfig } from './types/GenericColumnType';
import { CellBackgroundType, ColumnType } from './types/GenericColumnType';
import type { CellDataType } from './types/GenericTableType';

export const formatCellTextStyle = <TActionType extends string = string, TActionOn = string>(
  cellValue: CellDataType<TActionType, TActionOn>,
) => {
  const { type } = cellValue;

  const isTextCell = type === ColumnType.Text || type === ColumnType.TextWithIcon;
  const textCellStyle =
    isTextCell && cellValue.truncated
      ? {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }
      : {};

  return isTextCell ? { ...textCellStyle, fontFamily: cellValue.fontFamily } : undefined;
};

export const formatCellBackgroundStyle = <
  TColumnKey extends string | number,
  TActionType extends string = string,
  TActionOn = string,
>(
  cellValue: CellDataType<TActionType, TActionOn>,
  config: TableColumnConfig<TColumnKey>,
  theme: TTheme,
): React.CSSProperties | undefined => {
  // oxlint-disable-next-line @typescript-eslint/no-deprecated -- migration in progress. Will be removed in DSA-4660.
  const { numericFormattingSpec, analyticsNumberFormattingSpec, columnType } = config;
  const cellBackground =
    (cellValue.type === ColumnType.Number ? cellValue.cellBackground : config.cellBackground) ??
    config.cellBackground;
  if (!cellBackground) {
    return undefined;
  }

  const { type, color, fullOpacityScale } = cellBackground;
  const bgColor = getTableCellBackgroundRgbTuple(color, theme);

  switch (type) {
    case CellBackgroundType.ValueOpacityFill:
    case CellBackgroundType.ValuePercentageWidthFill: {
      if (
        analyticsNumberFormattingSpec &&
        analyticsNumberFormattingSpec.numberFormatOptions.style !== 'percent'
      ) {
        return undefined;
      }

      if (
        numericFormattingSpec &&
        numericFormattingSpec.unit !== ChartUnit.Percentage &&
        numericFormattingSpec.unit !== ChartUnit.LegacyPercentage
      ) {
        return undefined;
      }

      if (columnType !== ColumnType.Number) {
        return undefined;
      }

      // cellValue has to be a number given the columnType check above
      // if not, we throw an error to catch this in development
      if (cellValue.type !== ColumnType.Number) {
        throw new Error('Cell value is not a number');
      }

      return type === CellBackgroundType.ValuePercentageWidthFill
        ? {
            background: formatProgressionLinearGradient(cellValue.value, `rgb(${bgColor})`),
            backgroundOrigin: 'border-box',
          }
        : {
            background: `rgba(${bgColor}, ${fullOpacityScale ? Math.min(1, cellValue.value / fullOpacityScale) : cellValue.value})`,
          };
    }
    case CellBackgroundType.ConstantFill: {
      return {
        background: `rgba(${bgColor}, 0.4)`,
      };
    }
    default:
      return undefined;
  }
};
