import { TTheme, useTheme } from '@rbx/ui';
import { useMemo } from 'react';

export enum ChartColor {
  Blue = 'Blue',
  Green = 'Green',
  Purple = 'Purple',
  Yellow = 'Yellow',
  Cyan = 'Cyan',
  Red = 'Red',
  Purple2 = 'Purple2',
  Orange = 'Orange',
  Blue2 = 'Blue2',
  Green2 = 'Green2',
  Purple3 = 'Purple3',
  Yellow2 = 'Yellow2',
  Yellow3 = 'Yellow3',
  Green3 = 'Green3',
  Cyan2 = 'Cyan2',
  Blue3 = 'Blue3',
  Purple4 = 'Purple4',
}

const DarkColorHexByChartColor: Record<ChartColor, string> = {
  [ChartColor.Blue]: '#3C64FA',
  [ChartColor.Green]: '#44DA87',
  [ChartColor.Purple]: '#DA40FC',
  [ChartColor.Yellow]: '#F7D469',
  [ChartColor.Cyan]: '#0CC3E4',
  [ChartColor.Red]: '#F45B52',
  [ChartColor.Purple2]: '#B384FB',
  [ChartColor.Orange]: '#FC9855',
  [ChartColor.Blue2]: '#73A0FA',
  [ChartColor.Green2]: '#8FEAB7',
  [ChartColor.Purple3]: '#EA91F8',
  [ChartColor.Yellow2]: '#FADE89',
  [ChartColor.Yellow3]: '#F0E59D',
  [ChartColor.Green3]: '#6AD79B',
  [ChartColor.Cyan2]: '#16A7A5',
  [ChartColor.Blue3]: '#596AAC',
  [ChartColor.Purple4]: '#4F2687',
};

const LightColorHexByChartColor: Record<ChartColor, string> = {
  [ChartColor.Blue]: '#3C64FA',
  [ChartColor.Green]: '#27C473',
  [ChartColor.Purple]: '#DA40FC',
  [ChartColor.Yellow]: '#F3BA2B',
  [ChartColor.Cyan]: '#0AB4D6',
  [ChartColor.Red]: '#F45B52',
  [ChartColor.Purple2]: '#9E58F3',
  [ChartColor.Orange]: '#FC9855',
  [ChartColor.Blue2]: '#284DE2',
  [ChartColor.Green2]: '#0F995B',
  [ChartColor.Purple3]: '#A61BC6',
  [ChartColor.Yellow2]: '#D4A121',
  [ChartColor.Yellow3]: '#F0E59D',
  [ChartColor.Green3]: '#6AD79B',
  [ChartColor.Cyan2]: '#16A7A5',
  [ChartColor.Blue3]: '#596AAC',
  [ChartColor.Purple4]: '#4F2687',
};

export const OrderedChartColors = [
  ChartColor.Blue,
  ChartColor.Green,
  ChartColor.Purple,
  ChartColor.Yellow,
  ChartColor.Cyan,
  ChartColor.Red,
  ChartColor.Purple2,
  ChartColor.Orange,
  ChartColor.Blue2,
  ChartColor.Green2,
  ChartColor.Purple3,
  ChartColor.Yellow2,
];

const lightColors = OrderedChartColors.map((color) => LightColorHexByChartColor[color]);
const darkColors = OrderedChartColors.map((color) => DarkColorHexByChartColor[color]);

type TChartThemedColors = {
  axis: string;
  axisValueText: string;
  legendText: string;
  dataLabelText: string;
  benchmarkLineColor: string;
  comparisonLineColor: string;
  tooltipBackground: string;
  tooltipText: string;
  columnTotalSeriesLineColor: string;
  zoneLegendSymbol: string;
  annotationVerticalLine: string;
  annotationVerticalRange: string;
};

export const getChartColorHexString = (color: ChartColor, theme: TTheme): string => {
  return theme.palette.mode === 'light'
    ? LightColorHexByChartColor[color]
    : DarkColorHexByChartColor[color];
};

export const getChartThemedColors = (theme: TTheme): TChartThemedColors => {
  const isDarkTheme = theme.palette.mode === 'dark';
  return {
    axis: theme.palette.content.disabled,
    axisValueText: theme.palette.content.muted,
    legendText: theme.palette.content.standard,
    dataLabelText: theme.palette.content.standard,
    benchmarkLineColor: theme.palette.content.standard,
    comparisonLineColor: getChartColorHexString(ChartColor.Blue, theme),
    tooltipText: theme.palette.content.inverse,
    tooltipBackground: theme.palette.content.standard,
    columnTotalSeriesLineColor: theme.palette.content.standard,
    zoneLegendSymbol: '#BBBCBE',
    annotationVerticalLine: isDarkTheme ? theme.palette.common.white : theme.palette.common.black,
    annotationVerticalRange: getChartColorHexString(ChartColor.Red, theme),
  };
};

export const getTreemapColorStops = (theme: TTheme): Array<[number, string]> => {
  return [
    [0, getChartColorHexString(ChartColor.Yellow3, theme)],
    [0.25, getChartColorHexString(ChartColor.Green3, theme)],
    [0.5, getChartColorHexString(ChartColor.Cyan2, theme)],
    [0.75, getChartColorHexString(ChartColor.Blue3, theme)],
    [1, getChartColorHexString(ChartColor.Purple4, theme)],
  ];
};

// We have same colors for light and dark themes for treemap, so we need to keep label the same color as well.
export const getTreemapLabelColor = (theme: TTheme, contentColor: 'standard' | 'inverse') => {
  if (theme.palette.mode === 'dark') {
    return contentColor === 'standard'
      ? theme.palette.content.standard
      : theme.palette.content.inverse;
  }
  return contentColor === 'standard'
    ? theme.palette.content.inverse
    : theme.palette.content.standard;
};

/**
 * This switches the chart line colors based on the theme mode.
 *
 * For colors that are embedded in the TTheme...
 * See also getChartThemedColors in modules/charts-generic/charts/options.tsx
 */
export const useChartColors = () => {
  const theme = useTheme();
  return useMemo(() => {
    // NOTE(gperkins@ 20231115): hardcode themeMode = 'light' in ModeResponsiveThemeProvider to test manually
    return theme.palette.mode === 'light' ? lightColors : darkColors;
  }, [theme]);
};
