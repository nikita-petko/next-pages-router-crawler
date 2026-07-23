import type { TTheme } from '@rbx/ui';
import { getTableCellBackgroundRgbTuple } from '../charts/options';
import type { TableColumnConfig } from './types/GenericColumnType';
import { CellBackgroundType } from './types/GenericColumnType';

const formatHeaderBackgroundStyle = <TColumnKey extends string | number>(
  config: TableColumnConfig<TColumnKey>,
  theme: TTheme,
): React.CSSProperties | undefined => {
  if (!config.headerBackground) {
    return undefined;
  }

  const { type, color } = config.headerBackground;

  switch (type) {
    case CellBackgroundType.ConstantFill: {
      return {
        background: `rgb(${getTableCellBackgroundRgbTuple(color, theme)})`,
      };
    }
    default:
      return undefined;
  }
};

export default formatHeaderBackgroundStyle;
