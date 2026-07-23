import React, { useMemo } from 'react';
import { Options, SeriesColumnOptions, SeriesSplineOptions } from 'highcharts';
import { useTheme } from '@rbx/ui';
import GenericSeriesChart from './GenericSeriesChart';
import {
  AxisType,
  useColumnChartXAxisOptions,
  XAxisFormatter,
} from './highchart-options/xAxisOptions';
import showLocalizedTime from './showLocalizedTimeForGranularity';
import { ChartStyleMode, ChartType, SeriesDataTypes } from './types/BaseChart';
import { getChartColorHexString } from './color';
import { useColumnSeriesPointOptions } from './highchart-options/seriesPointOptions';
import { useColumnChartPlotOptions } from './highchart-options/plotOptions';
import useCyclingTimeSeriesLegendItemClickHandler from './useCyclingTimeSeriesLegendItemClickHandler';
import {
  useAnnotationsCallback,
  useAnnotationsOptions,
} from './highchart-options/annotationsOptions';
import { SelectionCallback } from './useOnSelectChartRegion';
import useLegendTitleAndCreditOptions from './highchart-options/legendCreditAndTitleOptions';
import { useColumnChartChartOptions } from './highchart-options/chartOptions';
import {
  CategoricalSingleColumnSeries,
  NonCategoricalSingleColumnSeries,
} from './types/ColumnChart';
import { useColumnChartYAxisOptions, YAxisConfig } from './highchart-options/yAxisOptions';
import { useColumnChartTooltipOptions } from './highchart-options/tooltipOptions';
import {
  usePerSeriesTooltipPointFormatter,
  SeriesKeyForPointFormatter,
  SeriesValueForPointFormatter,
} from './formatters/tooltipFormatters';
import { useChartIsInAbnormalState } from './context/ChartIsInAbnormalStateContext';
import { getColumnStyleOptionsByDataType } from './highchart-options/seriesStylesOptions';
import {
  useNarrowWidthResponsiveRulesOptions,
  useSmallHeightResponsiveRulesOptions,
} from './highchart-options/responsiveRulesOptions';
import WithAnnotations, { AnnotationProps } from './annotations/WithAnnnotations';

type ColumnChartProps<CategoricalX extends string, X extends number, Y extends number> = {
  data:
    | {
        orderedCategories: string[];
        series: Array<CategoricalSingleColumnSeries<CategoricalX, Y>>;
      }
    | {
        series: Array<NonCategoricalSingleColumnSeries<X, Y>>;
      };

  /**
   * Formatters for content appear in tooltips
   * Tooltip next to the hovered point has format: colored-dot formated-key formated-value
   * Tooltip close to the x-axis has format: formated-x-value
   */
  tooltipFormatters: {
    formatSeriesKeyForPoint: SeriesKeyForPointFormatter<CategoricalX | X>;
    formatSeriesValueForPoint: SeriesValueForPointFormatter<Y>;
    formatXForPoint: (x: number | string) => string;
  };

  xAxisFormatter: XAxisFormatter;
  xAxisType: AxisType;
  xAxisBounds?: [number, number];

  yAxisConfig?: YAxisConfig;

  stacking?: boolean;

  chartStyleMode?: ChartStyleMode;
  /**
   * If not specified, the chart will be rendered with a chartStyleMode dependent default height
   */
  height?: number;

  onSelectChartRegion?: SelectionCallback<X>;
  onChartLoad?: () => void;
} & AnnotationProps;

const ColumnChart = <CategoricalX extends string, X extends number, Y extends number>({
  data,
  xAxisFormatter,
  xAxisType,
  xAxisBounds,
  yAxisConfig,
  annotations,
  onAnnotationsPositionsUpdated,
  height,
  onSelectChartRegion,
  onChartLoad,
  tooltipFormatters,
  stacking = true,
  chartStyleMode = ChartStyleMode.Normal,
}: ColumnChartProps<CategoricalX, X, Y>) => {
  const theme = useTheme();
  const isChartInAbnormalState = useChartIsInAbnormalState();
  const { updateSeriesLegendItemClickHandlers } = useCyclingTimeSeriesLegendItemClickHandler();
  const seriesPointOptions = useColumnSeriesPointOptions();

  /**
   * Check if there any positive columns (i.e. above x-axis)
   * For example, for column chart below:
   *           highest altitude: 3
   *                  ⬆️
   *                  ||
   *         ||    || ||    ||
   *   || || || || || || || || ||
   * 0 ---------------------------
   *            || ||    ||
   *            ||
   *            ⬇️
   *      lowest altitude: -2
   */
  const { hasPositiveAltitude, hasNegativeAltitude } = useMemo(() => {
    return {
      hasPositiveAltitude: data.series.some(({ dataPoints }) => {
        return dataPoints.some(([, y]) => y !== null && y > 0);
      }),
      hasNegativeAltitude: data.series.some(({ dataPoints }) => {
        return dataPoints.some(([, y]) => y !== null && y < 0);
      }),
    };
  }, [data.series]);

  const perSeriesPointFormatter = usePerSeriesTooltipPointFormatter({
    formatSeriesKeyForPoint: tooltipFormatters.formatSeriesKeyForPoint,
    formatSeriesValueForPoint: tooltipFormatters.formatSeriesValueForPoint,
  });

  const {
    series,
    categories,
  }: { series: Array<SeriesColumnOptions | SeriesSplineOptions>; categories?: string[] } =
    useMemo(() => {
      if (isChartInAbnormalState) {
        return { series: [] };
      }
      const isCategorical = 'orderedCategories' in data;
      if (isCategorical) {
        const orderedCategories = new Map(
          data.orderedCategories.map((category, index) => [category, index]),
        );
        return {
          series: data.series.map(({ id, name, dataPoints, custom, color }) => {
            const sortedDataPoints = [...dataPoints].sort(
              (pointA, pointB) =>
                (orderedCategories.get(pointA[0]) ?? Infinity) -
                (orderedCategories.get(pointB[0]) ?? Infinity),
            );
            return {
              id,
              name,
              data: sortedDataPoints,
              type: ChartType.Column,
              custom,
              color: color ? getChartColorHexString(color, theme) : undefined,
              point: seriesPointOptions,
              // NOTE(shumingxu, 2024-12-10): softThreshold allows highcharts to have a >0 y-axis max even if all data points are negative
              // This allows us to apply maxPadding for annotations without manually overriding the y-axis max.
              // See: https://api.highcharts.com/highcharts/yAxis.maxPadding and y-axis options for column chart
              // TLDR; set softThreshold to false when there are no positive columns
              softThreshold: hasPositiveAltitude,
            };
          }),
          categories: data.orderedCategories,
        };
      }

      return {
        series: data.series.map(({ id, name, dataPoints, type, custom, color }) => {
          // Non-categorical series might have a 'Total' series, need to render it as a line instead of a column
          const isTotalSeries = type === SeriesDataTypes.Total;
          return {
            id,
            name,
            data: dataPoints,
            type: isTotalSeries ? ChartType.Spline : ChartType.Column,
            custom: {
              ...custom,
              seriesType: type, // Add series type to custom metadata
            },
            // Total series is always on top
            zIndex: isTotalSeries ? 2 : 1,
            point: seriesPointOptions,
            ...getColumnStyleOptionsByDataType(theme, type, color),
            softThreshold: hasPositiveAltitude,
            tooltip: {
              pointFormatter: perSeriesPointFormatter,
            },
          };
        }),
      };
    }, [
      data,
      hasPositiveAltitude,
      isChartInAbnormalState,
      perSeriesPointFormatter,
      seriesPointOptions,
      theme,
    ]);

  const { annotationOptions, plotBandsOptions } = useAnnotationsOptions(
    isChartInAbnormalState ? undefined : annotations,
  );

  const plotOptions = useColumnChartPlotOptions({ stacking });

  const onChartRender = useAnnotationsCallback({
    annotations,
    onAnnotationsPositionsUpdated,
  });
  const chartOptions = useColumnChartChartOptions({
    onSelectChartRegion,
    onChartLoad,
    onChartRender,
    chartStyleMode,
    height,
  });

  const xAxisOptions = useColumnChartXAxisOptions({
    xAxisFormatter,
    axisType: xAxisType,
    categories,
    plotBandsOptions,
    xAxisBounds: isChartInAbnormalState ? undefined : xAxisBounds,
  });

  const yAxisOptions = useColumnChartYAxisOptions({
    chartStyleMode,
    yAxisConfig,
    isAnnotationOn: !!annotations?.length,
    // highlight x-axis if there are positive columns and negative columns
    highlightXAxis: hasNegativeAltitude && hasPositiveAltitude,
  });

  const tooltipOptions = useColumnChartTooltipOptions({
    formatX: tooltipFormatters.formatXForPoint,
  });

  const legendTitleAndCreditOptions = useLegendTitleAndCreditOptions({ chartStyleMode });
  const smallHeightResponsiveRulesOptions = useSmallHeightResponsiveRulesOptions();
  const narrowWidthResponsiveRulesOptions = useNarrowWidthResponsiveRulesOptions();

  const highchartsOptions = useMemo(() => {
    const options: Options = {
      series,
      annotations: annotationOptions,
      plotOptions,
      chart: chartOptions,
      xAxis: xAxisOptions,
      yAxis: yAxisOptions,
      tooltip: tooltipOptions,
      responsive: { rules: [smallHeightResponsiveRulesOptions, narrowWidthResponsiveRulesOptions] },
      ...legendTitleAndCreditOptions,
    };

    updateSeriesLegendItemClickHandlers(options);

    return options;
  }, [
    series,
    annotationOptions,
    plotOptions,
    chartOptions,
    xAxisOptions,
    yAxisOptions,
    tooltipOptions,
    smallHeightResponsiveRulesOptions,
    narrowWidthResponsiveRulesOptions,
    legendTitleAndCreditOptions,
    updateSeriesLegendItemClickHandlers,
  ]);

  return (
    <GenericSeriesChart
      options={highchartsOptions}
      showLocalizedTime={xAxisType.type === 'datetime' && showLocalizedTime(xAxisType.granularity)}
    />
  );
};

export default WithAnnotations(React.memo(ColumnChart));
