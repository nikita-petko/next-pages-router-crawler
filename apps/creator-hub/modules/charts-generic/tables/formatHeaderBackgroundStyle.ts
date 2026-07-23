import { TTheme } from '@rbx/ui';
import { CellBackgroundType, TableColumnConfig } from './types/GenericColumnType';
import { TableCellBackgroundColorToRGBA } from '../charts/options';

const formatHeaderBackgroundStyle = <TColumnKey extends string | number>(
  config: TableColumnConfig<TColumnKey>,
  theme: TTheme,
): React.CSSProperties | undefined => {
  if (!config.headerBackground) {
    return undefined;
  }

  const { type, color } = config.headerBackground;
  const isDarkTheme = theme.palette.mode === 'dark';
  const { lightMode, darkMode } = TableCellBackgroundColorToRGBA[color];

  switch (type) {
    case CellBackgroundType.ConstantFill: {
      return {
        background: `rgb(${isDarkTheme ? darkMode : lightMode})`,
      };
    }
    default:
      return undefined;
  }
};

export default formatHeaderBackgroundStyle;
