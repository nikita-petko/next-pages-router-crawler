import type { Options, SeriesAreaOptions, SeriesOptionsType } from 'highcharts';
import React, { useMemo } from 'react';
import { useTheme } from '@rbx/ui';
import type { AnnotationProps } from './annotations/WithAnnnotations';
import WithAnnotations from './annotations/WithAnnnotations';
import { useChartIsInAbnormalState } from './context/ChartIsInAbnormalStateContext';
import type {
  SeriesKeyForPointFormatter,
  SeriesValueForPointFormatter,
} from './formatters/tooltipFormatters';
import { usePerSeriesTooltipPointFormatter } from './formatters/tooltipFormatters';
import GenericSeriesChart from './GenericSeriesChart';
import {
  useAnnotationsCallback,
  useAnnotationsOptions,
} from './highchart-options/annotationsOptions';
import { useAreaChartChartOptions } from './highchart-options/chartOptions';
import useLegendTitleAndCreditOptions from './highchart-options/legendCreditAndTitleOptions';
import { useAreaChartPlotOptions } from './highchart-options/plotOptions';
import { useSmallHeightResponsiveRulesOptions } from './highchart-options/responsiveRulesOptions';
import { getAreaStyleOptionsByDataType } from './highchart-options/seriesStylesOptions';
import { useAreaChartTooltipOptions } from './highchart-options/tooltipOptions';
import type { AxisType, XAxisFormatter } from './highchart-options/xAxisOptions';
import { useAreaChartXAxisOptions } from './highchart-options/xAxisOptions';
import type { YAxisConfig } from './highchart-options/yAxisOptions';
import { useAreaChartYAxisOptions } from './highchart-options/yAxisOptions';
import showLocalizedTime from './showLocalizedTimeForGranularity';
import type { SingleAreaSeries } from './types/AreaChart';
import { ChartStyleMode, ChartType } from './types/BaseChart';
import useCyclingTimeSeriesLegendItemClickHandler from './useCyclingTimeSeriesLegendItemClickHandler';
import type { SelectionCallback } from './useOnSelectChartRegion';

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
