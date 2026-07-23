import { useCallback, useMemo } from 'react';
import { useTheme } from '@rbx/ui';
import {
  AxisLabelsFormatterCallbackFunction,
  AxisLabelsFormatterContextObject,
  YAxisOptions,
} from 'highcharts';
import { getChartThemedColors } from '../color';
import { ChartStyleMode } from '../types/BaseChart';

export type YAxisConfig = {
  id?: string;
  yAxisFormatter?: YAxisFormatter;
  yAxisTitle?: string;
  visible?: boolean;
  decimalPrecision?: number;
};

export type YAxisFormatter = ({ value }: { value: string | number }) => string;

const useDefaultYAxisOptions = ({
  chartStyleMode,
  isAnnotationOn,
  minYAxisOverride,
}: {
  chartStyleMode: ChartStyleMode;
  isAnnotationOn?: boolean;
  minYAxisOverride?: number;
}): Pick<YAxisOptions, 'title' | 'labels' | 'gridLineColor' | 'gridLineDashStyle' | 'visible'> => {
  const theme = useTheme();
  return useMemo(() => {
    let visible: boolean | undefined;
    switch (chartStyleMode) {
      case ChartStyleMode.Normal:
        visible = true;
        break;
      case ChartStyleMode.Minimal:
        visible = false;
        break;
      default: {
        const exhaustiveCheck: never = chartStyleMode;
        throw new Error(`Unhandled chartStyleMode: ${exhaustiveCheck}`);
      }
    }

    return {
      /*
      NOTE:
      - Removing the line entirely results in a placeholder value and does not remove title
      - Following their documentation https://api.highcharts.com/highcharts/xAxis.title.enabled
        to remove the title by setting text to be undefined
    */
      title: {
        text: undefined,
        style: { color: getChartThemedColors(theme).axisValueText },
      },
      labels: {
        style: {
          color: getChartThemedColors(theme).axisValueText,
        },
      },
      gridLineColor: getChartThemedColors(theme).axis,
      gridLineDashStyle: 'ShortDash',
      min: minYAxisOverride,
      // extend y-axis max padding to make room for rendering annotations
      maxPadding: isAnnotationOn ? 0.15 : undefined,
      visible,
    };
  }, [chartStyleMode, isAnnotationOn, minYAxisOverride, theme]);
};

export const useLineChartYAxisOptions = ({
  chartStyleMode,
  yAxisConfigs,
  isAnnotationOn,
  minYAxisOverride,
}: {
  chartStyleMode: ChartStyleMode;
  yAxisConfigs?: YAxisConfig[];
  isAnnotationOn?: boolean;
  minYAxisOverride?: number;
}): YAxisOptions[] => {
  const defaultYAxisOptions = useDefaultYAxisOptions({
    chartStyleMode,
    isAnnotationOn,
    minYAxisOverride,
  });

  const getYAxisOptionsByConfig = useCallback(
    (yAxisConfig: YAxisConfig): YAxisOptions => {
      const { yAxisTitle, yAxisFormatter, visible, id, decimalPrecision } = yAxisConfig;

      function wrappedYAxisFormatter(this: AxisLabelsFormatterContextObject): string {
        const { value } = this;
        return yAxisFormatter!({ value });
      }

      function wrappedDefaultFormatterWithDecimalPrecision(this: AxisLabelsFormatterContextObject): string {
        const defaultLabel = this.axis.defaultLabelFormatter.call(this);
        const numValue =
          typeof this.value === 'number' ? this.value : parseFloat(String(this.value));
        const rounded = parseFloat(numValue.toFixed(decimalPrecision!));
        if (rounded === numValue) {
          return defaultLabel;
        }
        return defaultLabel.replace(/\d+\.\d+/, (match) =>
          String(parseFloat(parseFloat(match).toFixed(decimalPrecision!))),
        );
      }

      return {
        ...defaultYAxisOptions,
        id,
        title: { ...defaultYAxisOptions.title, text: yAxisTitle },
        labels: {
          ...defaultYAxisOptions.labels,
          formatter: yAxisFormatter ? wrappedYAxisFormatter : wrappedDefaultFormatterWithDecimalPrecision,
        },
        // override default visibility if provided
        visible: visible ?? defaultYAxisOptions.visible,
        allowDecimals: decimalPrecision !== undefined && decimalPrecision === 0 ? false : undefined,
      };
    },
    [defaultYAxisOptions],
  );

  return useMemo(() => {
    if (!yAxisConfigs || yAxisConfigs.length === 0) {
      return [defaultYAxisOptions];
    }
    return yAxisConfigs.map(getYAxisOptionsByConfig);
  }, [defaultYAxisOptions, getYAxisOptionsByConfig, yAxisConfigs]);
};

export const useAreaChartYAxisOptions = ({
  chartStyleMode,
  yAxisConfig,
  minYAxisOverride,
  isAnnotationOn,
}: {
  chartStyleMode: ChartStyleMode;
  yAxisConfig?: YAxisConfig;
  minYAxisOverride?: number;
  isAnnotationOn?: boolean;
}) =>
  useLineChartYAxisOptions({
    chartStyleMode,
    yAxisConfigs: yAxisConfig ? [yAxisConfig] : undefined,
    isAnnotationOn,
    minYAxisOverride,
  })[0];

export const useColumnChartYAxisOptions = ({
  chartStyleMode,
  yAxisConfig,
  isAnnotationOn,
  highlightXAxis,
}: {
  chartStyleMode: ChartStyleMode;
  yAxisConfig?: YAxisConfig;
  isAnnotationOn?: boolean;
  highlightXAxis?: boolean;
}): YAxisOptions => {
  const theme = useTheme();
  const yAxisFormatter: AxisLabelsFormatterCallbackFunction = useCallback(
    function formatter(this: AxisLabelsFormatterContextObject) {
      return yAxisConfig?.yAxisFormatter?.({ value: this.value }) ?? '';
    },
    [yAxisConfig],
  );

  const defaultYAxisOptions = useDefaultYAxisOptions({
    chartStyleMode,
    isAnnotationOn,
  });

  return useMemo(
    () => ({
      ...defaultYAxisOptions,
      id: yAxisConfig?.id,
      title: {
        ...defaultYAxisOptions.title,
        text: yAxisConfig?.yAxisTitle,
      },
      labels: {
        ...defaultYAxisOptions.labels,
        formatter: yAxisConfig?.yAxisFormatter ? yAxisFormatter : undefined,
      },
      gridLineWidth: 0.5,
      plotLines: highlightXAxis
        ? [
            {
              color: getChartThemedColors(theme).axis,
              width: 3,
              value: 0,
            },
          ]
        : undefined,
      visible: yAxisConfig?.visible ?? defaultYAxisOptions.visible,
    }),
    [
      defaultYAxisOptions,
      highlightXAxis,
      theme,
      yAxisConfig?.id,
      yAxisConfig?.visible,
      yAxisConfig?.yAxisFormatter,
      yAxisConfig?.yAxisTitle,
      yAxisFormatter,
    ],
  );
};

export const useBarChartYAxisOptions = (): YAxisOptions => {
  return useMemo(
    () => ({
      visible: false,
    }),
    [],
  );
};
