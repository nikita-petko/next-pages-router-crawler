import React, { useMemo } from 'react';
import { useTheme } from '@rbx/ui';
import { Options, SeriesAreaOptions, SeriesOptionsType } from 'highcharts';
import {
  AxisType,
  useAreaChartXAxisOptions,
  XAxisFormatter,
} from './highchart-options/xAxisOptions';
import GenericSeriesChart from './GenericSeriesChart';
import showLocalizedTime from './showLocalizedTimeForGranularity';
import useCyclingTimeSeriesLegendItemClickHandler from './useCyclingTimeSeriesLegendItemClickHandler';
import { SingleAreaSeries } from './types/AreaChart';
import { ChartStyleMode, ChartType } from './types/BaseChart';
import {
  useAnnotationsCallback,
  useAnnotationsOptions,
} from './highchart-options/annotationsOptions';
import useLegendTitleAndCreditOptions from './highchart-options/legendCreditAndTitleOptions';
import { getAreaStyleOptionsByDataType } from './highchart-options/seriesStylesOptions';
import {
  usePerSeriesTooltipPointFormatter,
  SeriesKeyForPointFormatter,
  SeriesValueForPointFormatter,
} from './formatters/tooltipFormatters';
import { useAreaChartPlotOptions } from './highchart-options/plotOptions';
import { useAreaChartChartOptions } from './highchart-options/chartOptions';
import { SelectionCallback } from './useOnSelectChartRegion';
import { useAreaChartYAxisOptions, YAxisConfig } from './highchart-options/yAxisOptions';
import { useAreaChartTooltipOptions } from './highchart-options/tooltipOptions';
import { useChartIsInAbnormalState } from './context/ChartIsInAbnormalStateContext';
import { useSmallHeightResponsiveRulesOptions } from './highchart-options/responsiveRulesOptions';
import WithAnnotations, { AnnotationProps } from './annotations/WithAnnnotations';

type AreaChartProps<X extends number, Y extends number> = {
  data: {
    series: Array<SingleAreaSeries<X, Y>>;
  };

  /**
   * Formatters for content appear in tooltips
   * Tooltip next to the hovered point has format: colored-dot formated-key formated-value
   * Tooltip close to the x-axis has format: formated-x-value
   */
  tooltipFormatters: {
    formatSeriesKeyForPoint: SeriesKeyForPointFormatter<X>;
    formatSeriesValueForPoint: SeriesValueForPointFormatter<Y>;
    formatXForPoint: (x: number | string) => string;
  };

  xAxisFormatter: XAxisFormatter;
  xAxisType: AxisType;
  xAxisTickPositions?: number[];
  xAxisBounds?: [number, number];

  yAxisConfig?: YAxisConfig;

  chartStyleMode?: ChartStyleMode;
  /**
   * If not specified, the chart will be rendered with a chartStyleMode dependent default height
   */
  height?: number;

  onSelectChartRegion?: SelectionCallback<X>;
  onChartLoad?: () => void;
} & AnnotationProps;

const AreaChart = <X extends number, Y extends number>({
  data,
  tooltipFormatters,
  height,
  annotations,
  onAnnotationsPositionsUpdated,
  onSelectChartRegion,
  onChartLoad,
  xAxisType,
  xAxisFormatter,
  xAxisTickPositions,
  xAxisBounds,
  yAxisConfig,
  chartStyleMode = ChartStyleMode.Normal,
}: AreaChartProps<X, Y>) => {
  const theme = useTheme();
  const isChartInAbnormalState = useChartIsInAbnormalState();
  const { updateSeriesLegendItemClickHandlers } = useCyclingTimeSeriesLegendItemClickHandler();
  const perSeriesPointFormatter = usePerSeriesTooltipPointFormatter({
    formatSeriesKeyForPoint: tooltipFormatters.formatSeriesKeyForPoint,
    formatSeriesValueForPoint: tooltipFormatters.formatSeriesValueForPoint,
  });

  const {
    series,
    minYAxisOverride,
  }: { series: Array<SeriesOptionsType>; minYAxisOverride?: number } = useMemo(() => {
    if (isChartInAbnormalState) {
      return { series: [] };
    }
    const { series: givenSeries } = data;
    let minDataPoint = Infinity;
    const results: SeriesOptionsType[] = [];
    givenSeries.forEach(({ id, name, dataPoints, type, custom, color }, idx) => {
      minDataPoint = Math.min(
        minDataPoint,
        ...dataPoints.map((point) => point[1]).filter((point) => point !== null),
      );

      const result: SeriesAreaOptions = {
        id,
        name,
        data: dataPoints,
        custom: {
          ...custom,
          seriesType: type, // Add series type to custom metadata
        },
        type: ChartType.Area,
        zIndex: givenSeries.length - idx,
        ...getAreaStyleOptionsByDataType(theme, type, color),
        tooltip: {
          pointFormatter: perSeriesPointFormatter,
        },
      };

      results.push(result);
    });

    return {
      series: results,
      minYAxisOverride: minDataPoint !== Infinity && minDataPoint < 0 ? minDataPoint : undefined,
    };
  }, [data, isChartInAbnormalState, perSeriesPointFormatter, theme]);

  const { annotationOptions, plotBandsOptions } = useAnnotationsOptions(
    isChartInAbnormalState ? undefined : annotations,
  );

  const plotOptions = useAreaChartPlotOptions();

  const xAxisOptions = useAreaChartXAxisOptions({
    axisType: xAxisType,
    tickPositions: xAxisTickPositions,
    xAxisFormatter,
    plotBandsOptions,
    xAxisBounds: isChartInAbnormalState ? undefined : xAxisBounds,
  });

  const yAxisOptions = useAreaChartYAxisOptions({
    chartStyleMode,
    yAxisConfig,
    minYAxisOverride,
    isAnnotationOn: !!annotations?.length,
  });

  const onChartRender = useAnnotationsCallback({
    annotations,
    onAnnotationsPositionsUpdated,
  });
  const chartOptions = useAreaChartChartOptions({
    onSelectChartRegion,
    onChartLoad,
    onChartRender,
    chartStyleMode,
    height,
  });

  const tooltipOptions = useAreaChartTooltipOptions({
    formatX: tooltipFormatters.formatXForPoint,
  });
  const smallHeightResponsiveRulesOptions = useSmallHeightResponsiveRulesOptions();

  const legendTitleAndCreditOptions = useLegendTitleAndCreditOptions({
    chartStyleMode,
  });

  const highchartsOptions = useMemo(() => {
    const options: Options = {
      series,
      annotations: annotationOptions,
      plotOptions,
      chart: chartOptions,
      xAxis: xAxisOptions,
      yAxis: yAxisOptions,
      tooltip: tooltipOptions,
      responsive: { rules: [smallHeightResponsiveRulesOptions] },
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

export default WithAnnotations(React.memo(AreaChart));
