import React, { useMemo, memo } from 'react';
import { Options, SeriesBarOptions } from 'highcharts';
import { TIconProps, useTheme } from '@rbx/ui';
import GenericSeriesChart from './GenericSeriesChart';
import { SingleBarSeries } from './types/BarChart';
import { ChartStyleMode, ChartType } from './types/BaseChart';
import useLegendTitleAndCreditOptions from './highchart-options/legendCreditAndTitleOptions';
import { useBarChartYAxisOptions } from './highchart-options/yAxisOptions';
import { useBarChartXAxisOptions } from './highchart-options/xAxisOptions';
import { DataLabelsFormatter } from './formatters/dataLabelsFormatters';
import { useBarChartPlotOptions } from './highchart-options/plotOptions';
import { useBarChartChartOptions } from './highchart-options/chartOptions';
import {
  usePerSeriesTooltipPointFormatter,
  SeriesKeyForPointFormatter,
  SeriesValueForPointFormatter,
} from './formatters/tooltipFormatters';
import { useBarChartTooltipOptions } from './highchart-options/tooltipOptions';
import { useChartIsInAbnormalState } from './context/ChartIsInAbnormalStateContext';
import { getChartColorHexString } from './color';
import { useSmallHeightResponsiveRulesOptions } from './highchart-options/responsiveRulesOptions';
import { useBarSeriesPointOptions } from './highchart-options/seriesPointOptions';

type BarChartProps<Category extends string, Value extends number> = {
  data: {
    series: Array<SingleBarSeries<Category, Value>>;
    orderedCategories: Category[];
  };

  /**
   * Formatters for content appear in tooltips
   * Tooltip next to the hovered point has format: formated-key: formated-value
   */
  tooltipFormatters: {
    formatSeriesKeyForPoint: SeriesKeyForPointFormatter<Category>;
    formatSeriesValueForPoint: SeriesValueForPointFormatter<Value>;
  };

  dataLabelsFormatter?: DataLabelsFormatter;
  DataLabelLeadingIcon?: React.FC<TIconProps>;

  forceHideLegends?: boolean;
  chartStyleMode?: ChartStyleMode;
  /**
   * If not specified, the chart will be rendered with a chartStyleMode dependent default height
   */
  height?: number;

  onChartLoad?: () => void;
};

const BarChart = <Category extends string, Value extends number>({
  data,
  tooltipFormatters,
  dataLabelsFormatter,
  forceHideLegends,
  DataLabelLeadingIcon,
  height,
  onChartLoad,
  chartStyleMode = ChartStyleMode.Normal,
}: BarChartProps<Category, Value>) => {
  const theme = useTheme();
  const isChartInAbnormalState = useChartIsInAbnormalState();
  const perSeriesPointFormatter = usePerSeriesTooltipPointFormatter({
    formatSeriesKeyForPoint: tooltipFormatters.formatSeriesKeyForPoint,
    formatSeriesValueForPoint: tooltipFormatters.formatSeriesValueForPoint,
  });
  const seriesPointOptions = useBarSeriesPointOptions();
  const orderedCategories = useMemo(
    () => new Map(data.orderedCategories.map((category, index) => [category, index])),
    [data.orderedCategories],
  );

  const {
    series,
    longestDataLabelLength,
  }: { series: Array<SeriesBarOptions>; longestDataLabelLength: number } = useMemo(() => {
    if (isChartInAbnormalState) {
      return {
        series: [],
        longestDataLabelLength: 0,
      };
    }

    // Data labels dom is rendered outside of chart, to accommodate the space they occupy,
    // we need to set an appropriate margin on the right side of the chart so that these labels
    // don't get cut off. This right margin is dynamic based on the longest data label.
    // The best we can do is to get the longest data label length and use that to calculate the margin.
    let longestDataLabel = 0;
    const barSeries: Array<SeriesBarOptions> = [];
    data.series.forEach(({ id, name, dataPoints, color }) => {
      const sortedDataPoints = [...dataPoints].sort(
        (pointA, pointB) =>
          (orderedCategories.get(pointA[0]) ?? Infinity) -
          (orderedCategories.get(pointB[0]) ?? Infinity),
      );
      barSeries.push({
        id,
        name,
        type: ChartType.Bar,
        data: sortedDataPoints,
        point: seriesPointOptions,
        tooltip: {
          pointFormatter: perSeriesPointFormatter,
        },
        color: color ? getChartColorHexString(color, theme) : undefined,
      });

      if (dataLabelsFormatter) {
        longestDataLabel = dataPoints.reduce((acc, [category, value]) => {
          const formattedDataLabel =
            value !== null
              ? `${dataLabelsFormatter({ y: value, category, seriesName: name })}`
              : '';
          return Math.max(acc, formattedDataLabel.length);
        }, 0);
      }
    });

    return { series: barSeries, longestDataLabelLength: longestDataLabel };
  }, [
    data.series,
    dataLabelsFormatter,
    isChartInAbnormalState,
    orderedCategories,
    perSeriesPointFormatter,
    seriesPointOptions,
    theme,
  ]);

  const plotOptions = useBarChartPlotOptions({
    formatDataLabel: dataLabelsFormatter,
    DataLabelLeadingIcon,
  });
  const chartOptions = useBarChartChartOptions({
    chartStyleMode,
    onChartLoad,
    height,
    longestDataLabelLength,
  });

  const xAxisOptions = useBarChartXAxisOptions(data.orderedCategories);

  const yAxisOptions = useBarChartYAxisOptions();

  const tooltipOptions = useBarChartTooltipOptions();

  const legendTitleAndCreditOptions = useLegendTitleAndCreditOptions({
    chartStyleMode,
    forceHideLegends,
  });
  const smallHeightResponsiveRulesOptions = useSmallHeightResponsiveRulesOptions();

  const highchartsOptions: Options = useMemo(() => {
    return {
      series,
      plotOptions,
      chart: chartOptions,
      xAxis: xAxisOptions,
      yAxis: yAxisOptions,
      tooltip: tooltipOptions,
      responsive: { rules: [smallHeightResponsiveRulesOptions] },
      ...legendTitleAndCreditOptions,
    };
  }, [
    chartOptions,
    legendTitleAndCreditOptions,
    plotOptions,
    series,
    smallHeightResponsiveRulesOptions,
    tooltipOptions,
    xAxisOptions,
    yAxisOptions,
  ]);

  return <GenericSeriesChart options={highchartsOptions} />;
};

export default memo(BarChart);
