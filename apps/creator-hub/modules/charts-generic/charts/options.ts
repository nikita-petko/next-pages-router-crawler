import { TTheme } from '@rbx/ui';
import { ChartStyleMode } from '@rbx/analytics-ui';

export const chartDefaultHeight = 450;

type TChartThemedColors = {
  background: string;
  layoutBackground: string;
  highlightBackground: string;
  axis: string;
  axisValueText: string;
  summaryText: string;
  legendText: string;
  dataLabelText: string;
  benchmarkLineColor: string;
  columnTotalSeriesLineColor: string;
  annotationBackground: string;
  annotationBorder: string;
  annotationText: string;
  tooltipBackground: string;
  tooltipText: string;
  benchmarkMarkLabelBackground: string;
  annotationVerticalLine: string;
};

export const getChartThemedColors = (theme: TTheme): TChartThemedColors => {
  const isDarkTheme = theme.palette.mode === 'dark';
  const annotationColors = {
    annotationBackground: theme.palette.common.white,
    annotationBorder: theme.palette.content.static.dark,
    annotationVerticalLine: isDarkTheme ? theme.palette.common.white : theme.palette.common.black,
    annotationText: '#3C64FA', // TODO(tyin): use primaryBrand once new blue is upgraded in webblox
  };

  return {
    background: theme.palette.surface[100],
    layoutBackground: theme.palette.surface[0],
    highlightBackground: theme.palette.actionV2.primaryBrand.fill,
    axis: theme.palette.content.disabled,
    axisValueText: theme.palette.content.muted,
    summaryText: theme.palette.content.standard,
    legendText: theme.palette.content.standard,
    dataLabelText: theme.palette.content.standard,
    benchmarkLineColor: theme.palette.content.standard,
    columnTotalSeriesLineColor: theme.palette.content.standard,
    tooltipText: theme.palette.content.standard,
    // TODO: tooltips on charts should not use this, probably use surface[400] instead
    tooltipBackground: theme.palette.surface[0],
    benchmarkMarkLabelBackground: theme.palette.surface[400],
    ...annotationColors,
  };
};

export const getChartDefaultHeightByMode = (chartStyleMode: ChartStyleMode): number => {
  switch (chartStyleMode) {
    case ChartStyleMode.Minimal:
      return 72;
    case ChartStyleMode.Normal:
      return chartDefaultHeight;
    default: {
      const exhaustiveCheck: never = chartStyleMode;
      throw new Error(`Unrecognized chartStyleMode ${exhaustiveCheck}.`);
    }
  }
};

// INFO(cmccarty@20230616) These params are deffs part of shapes, highcharts just doesn't have it in their type def for some reason
export interface ExtendedAnnotationsShapesOptions extends Highcharts.AnnotationsShapesOptions {
  x: number;
  y: number;
}

export enum TableCellBackgroundColor {
  Positive = 'Positive',
  Negative = 'Negative',
  Progression = 'Progression',
  Highlight = 'Highlight',
}

// NOTE(shumingxu, 04/08/2024): Colors are in rgb to support rgba. Hex is not supported
export const TableCellBackgroundColorToRGBA: Record<
  TableCellBackgroundColor,
  {
    lightMode: string;
    darkMode: string;
  }
> = {
  [TableCellBackgroundColor.Positive]: {
    lightMode: '68, 218, 135', // #44DA87
    darkMode: '68, 218, 135', // #44DA87
  },
  [TableCellBackgroundColor.Negative]: {
    lightMode: '224, 91, 82', // #F45B52
    darkMode: '224, 91, 82', // #F45B52
  },
  [TableCellBackgroundColor.Progression]: {
    lightMode: '60, 100, 250', // #3C64FA
    darkMode: '60, 100, 250', // #3C64FA
  },
  [TableCellBackgroundColor.Highlight]: {
    lightMode: '242, 242, 243', // #f2f2f3
    darkMode: '24, 25, 29', // #18191D
  },
};
