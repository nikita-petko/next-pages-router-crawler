import type {
  AxisLabelsFormatterCallbackFunction,
  XAxisOptions,
  XAxisPlotBandsOptions,
} from 'highcharts';
import { useCallback, useMemo } from 'react';
import { useTheme } from '@rbx/ui';
import { getChartThemedColors } from '../color';
import { XAxisGranularity } from '../types/BaseChart';

export type AxisType =
  | { type: 'linear' }
  | {
      type: 'datetime';
      granularity: XAxisGranularity;
    };

export type XAxisFormatter = ({ value }: { value: string | number }) => string;

export const useLineChartXAxisOptions = ({
  xAxisFormatter: givenXAxisFormatter,
  axisType,
  tickPositions,
  plotBandsOptions,
  xAxisBounds,
}: {
  xAxisFormatter: XAxisFormatter;
  axisType: AxisType;
  tickPositions?: number[];
  plotBandsOptions?: Array<XAxisPlotBandsOptions>;
  xAxisBounds?: [number, number];
}): XAxisOptions => {
  const { type } = axisType;
  const theme = useTheme();

  const xAxisFormatter: AxisLabelsFormatterCallbackFunction = useCallback(
    ({ value }) => givenXAxisFormatter({ value }),
    [givenXAxisFormatter],
  );

  return useMemo(() => {
    const commonOptions = {
      type,
      lineColor: getChartThemedColors(theme).axis,
      tickPositions,
      lineWidth: 1,
      tickLength: 0,
      width: '100%',
      plotBands: plotBandsOptions,
      ...(xAxisBounds ? { min: xAxisBounds[0], max: xAxisBounds[1] } : {}),
    };

    switch (type) {
      case 'linear':
        return {
          ...commonOptions,
          labels: {
            style: {
              color: getChartThemedColors(theme).axisValueText,
            },
            autoRotation: undefined,
            formatter: xAxisFormatter,
          },
        };
      case 'datetime': {
        const { granularity } = axisType;
        return {
          ...commonOptions,
          units: granularity === XAxisGranularity.Month ? [['month', [1]]] : undefined,
          labels: {
            style: {
              ...(granularity === XAxisGranularity.Day
                ? {
                    textOverflow: 'none',
                    whiteSpace: 'nowrap',
                  }
                : {}),
              color: getChartThemedColors(theme).axisValueText,
            },
            autoRotation: undefined, // disables rotations, labels wrap by default
            formatter: xAxisFormatter,
          },
        };
      }
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Unrecognized xAxis type ${exhaustiveCheck}.`);
      }
    }
  }, [axisType, plotBandsOptions, theme, tickPositions, type, xAxisBounds, xAxisFormatter]);
};

export const useAreaChartXAxisOptions = useLineChartXAxisOptions;

export const useColumnChartXAxisOptions = ({
  xAxisFormatter: givenXAxisFormatter,
  axisType,
  categories,
  plotBandsOptions,
  xAxisBounds,
}: {
  xAxisFormatter: XAxisFormatter;
  axisType: AxisType;
  categories?: Array<string>;
  plotBandsOptions?: Array<XAxisPlotBandsOptions>;
  xAxisBounds?: [number, number];
}): XAxisOptions => {
  const { type } = axisType;
  const theme = useTheme();

  const xAxisFormatter: AxisLabelsFormatterCallbackFunction = useCallback(
    ({ value }) => givenXAxisFormatter({ value }),
    [givenXAxisFormatter],
  );

  return useMemo(() => {
    const commonOptions = {
      type,
      categories,
      lineColor: getChartThemedColors(theme).axis,
      lineWidth: 1,
      tickLength: 0,
      width: '100%',
      labels: {
        style: {
          textOverflow: 'none',
          whiteSpace: 'nowrap',
          color: getChartThemedColors(theme).axisValueText,
        },
        // disable auto rotation, only rotate if it's categorical column chart
        autoRotation: undefined,
        rotation: categories?.length ? -45 : undefined,
        formatter: xAxisFormatter,
      },
      plotBands: plotBandsOptions,
      ...(xAxisBounds ? { min: xAxisBounds[0], max: xAxisBounds[1] } : {}),
    };

    switch (type) {
      case 'linear':
        return {
          ...commonOptions,
        };
      case 'datetime': {
        const { granularity } = axisType;
        return {
          ...commonOptions,
          units: granularity === XAxisGranularity.Month ? [['month', [1]]] : undefined,
        };
      }
      default: {
        const exhaustiveCheck: never = type;
        throw new Error(`Unrecognized xAxis type ${exhaustiveCheck}.`);
      }
    }
  }, [axisType, categories, plotBandsOptions, theme, type, xAxisFormatter, xAxisBounds]);
};

export const useBarChartXAxisOptions = (categories?: string[]): XAxisOptions => {
  const theme = useTheme();
  return useMemo(
    () => ({
      type: 'category',
      categories,
      lineWidth: 0,
      labels: {
        align: 'right',
        style: {
          color: getChartThemedColors(theme).axisValueText,
          fontSize: '14px',
          fontWeight: '300',
        },
        autoRotation: undefined,
      },
    }),
    [categories, theme],
  );
};
