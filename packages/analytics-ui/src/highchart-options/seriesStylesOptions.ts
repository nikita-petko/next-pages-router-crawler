import type { SeriesSplineOptions } from 'highcharts';
import type { TTheme } from '@rbx/ui';
import type { ChartColor } from '../color';
import { getChartColorHexString, getChartThemedColors } from '../color';
import type { TAreaSeriesDataTypes } from '../types/AreaChart';
import { SeriesDataTypes } from '../types/BaseChart';

type LineStyleOptions = Pick<
  SeriesSplineOptions,
  'dashStyle' | 'color' | 'lineWidth' | 'marker' | 'connectNulls' | 'opacity' | 'states'
>;

export const getLineStyleOptionsByDataType = (
  theme: TTheme,
  type: SeriesDataTypes,
  color?: ChartColor,
  showMarker?: boolean,
  opacity?: number,
): LineStyleOptions => {
  const specifiedColor = color ? getChartColorHexString(color, theme) : undefined;

  switch (type) {
    case SeriesDataTypes.Normal:
    case SeriesDataTypes.Total:
      return {
        color: specifiedColor,
        dashStyle: 'Solid',
        connectNulls: true,
        marker: { enabled: showMarker },
        opacity,
      };
    case SeriesDataTypes.Scatter:
      return {
        color: specifiedColor,
        marker: { enabled: true, symbol: 'circle' },
        connectNulls: true,
        lineWidth: 0,
        states: {
          hover: {
            lineWidthPlus: 0,
          },
        },
        opacity,
      };
    case SeriesDataTypes.Benchmark:
      return {
        color: specifiedColor ?? getChartThemedColors(theme).benchmarkLineColor,
        dashStyle: 'Solid',
        lineWidth: 1,
        marker: { enabled: false, symbol: 'circle' },
        connectNulls: true,
        opacity,
      };
    case SeriesDataTypes.Comparison:
      return {
        color: specifiedColor ?? getChartThemedColors(theme).comparisonLineColor,
        dashStyle: 'ShortDot',
        marker: { enabled: false, symbol: 'circle' },
        connectNulls: true,
        opacity,
      };
    case SeriesDataTypes.Noise:
      return {
        color: specifiedColor,
        dashStyle: 'Dash',
        connectNulls: true,
        marker: { enabled: showMarker },
        opacity,
      };
    case SeriesDataTypes.Projection:
      return {
        color: specifiedColor,
        dashStyle: 'Dash',
        connectNulls: true,
        opacity,
      };
    case SeriesDataTypes.Quota:
      return {
        color: specifiedColor ?? getChartThemedColors(theme).benchmarkLineColor,
        dashStyle: 'Dash',
        marker: { enabled: false, symbol: 'circle' },
        connectNulls: true,
        opacity,
      };
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled chart type: ${exhaustiveCheck}`);
    }
  }
};

export const getAreaStyleOptionsByDataType = (
  theme: TTheme,
  type: TAreaSeriesDataTypes,
  color?: ChartColor,
): LineStyleOptions => {
  const specifiedColor = color ? getChartColorHexString(color, theme) : undefined;
  switch (type) {
    case SeriesDataTypes.Normal:
    case SeriesDataTypes.Total:
      return {
        color: specifiedColor,
        dashStyle: 'Solid',
        marker: { enabled: false, symbol: 'circle' },
        connectNulls: true,
      };
    case SeriesDataTypes.Benchmark:
      return {
        color: specifiedColor ?? getChartThemedColors(theme).benchmarkLineColor,
        dashStyle: 'Solid',
        lineWidth: 1,
        marker: { enabled: false, symbol: 'circle' },
        connectNulls: true,
      };
    case SeriesDataTypes.Comparison:
      return {
        color: specifiedColor ?? getChartThemedColors(theme).comparisonLineColor,
        dashStyle: 'ShortDot',
        marker: { enabled: false, symbol: 'circle' },
        connectNulls: true,
      };
    case SeriesDataTypes.Projection:
      return {
        color: specifiedColor,
        dashStyle: 'Dash',
        connectNulls: true,
      };
    case SeriesDataTypes.Quota:
      return {
        color: specifiedColor ?? getChartThemedColors(theme).benchmarkLineColor,
        dashStyle: 'Dash',
        marker: { enabled: false, symbol: 'circle' },
        connectNulls: true,
      };
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled chart type: ${exhaustiveCheck}`);
    }
  }
};

export const getColumnStyleOptionsByDataType = (
  theme: TTheme,
  type: SeriesDataTypes.Total | SeriesDataTypes.Normal,
  color?: ChartColor,
) => {
  const specifiedColor = color ? getChartColorHexString(color, theme) : undefined;
  switch (type) {
    case SeriesDataTypes.Total: {
      return {
        color: specifiedColor || getChartThemedColors(theme).columnTotalSeriesLineColor,
      };
    }
    case SeriesDataTypes.Normal:
      return {
        color: specifiedColor,
      };
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unhandled chart type: ${exhaustiveCheck}`);
    }
  }
};
