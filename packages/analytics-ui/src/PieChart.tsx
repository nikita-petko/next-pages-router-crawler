import type { Options, SeriesPieOptions } from 'highcharts';
import React, { useMemo } from 'react';
import type { TIconProps } from '@rbx/ui';
import { useTheme } from '@rbx/ui';
import { getChartColorHexString } from './color';
import { useChartIsInAbnormalState } from './context/ChartIsInAbnormalStateContext';
import type { DataLabelsFormatter } from './formatters/dataLabelsFormatters';
import type { PieSliceFormatter } from './formatters/tooltipFormatters';
import GenericSeriesChart from './GenericSeriesChart';
import { usePieChartChartOptions } from './highchart-options/chartOptions';
import useLegendTitleAndCreditOptions from './highchart-options/legendCreditAndTitleOptions';
import { usePieChartPlotOptions } from './highchart-options/plotOptions';
import { usePieChartResponsiveRulesOptions } from './highchart-options/responsiveRulesOptions';
import { usePieChartTooltipOptions } from './highchart-options/tooltipOptions';
import { ChartStyleMode, ChartType } from './types/BaseChart';
import type { SinglePieSeries } from './types/PieChart';

type PieChartProps<SliceName extends string, Y extends number> = {
  data: {
    series: SinglePieSeries<SliceName, Y>;
  };

  /**
   * Formatters for tooltip content
   */
  tooltipFormatters: {
    formatSeriesKeyForSlice: PieSliceFormatter<SliceName, Y>;
    formatSeriesValueForSlice: PieSliceFormatter<SliceName, Y>;
  };

  /**
   * Optional data labels formatter for showing labels inside pie slices
   */
  formatDataLabel?: DataLabelsFormatter;

  /**
   * Optional leading icon for data labels
   */
  DataLabelLeadingIcon?: React.FC<TIconProps>;

  /**
   * Optional border color for pie slices
   */
  borderColor?: string;

  /**
   * Optional border width for pie slices
   */
  borderWidth?: number;

  chartStyleMode?: ChartStyleMode;
  /**
   * If not specified, the chart will be rendered with a chartStyleMode dependent default height
   */
  height?: number;

  onChartLoad?: () => void;
};

const PieChart = <SliceName extends string, Y extends number>({
  data,
  tooltipFormatters,
  formatDataLabel,
  DataLabelLeadingIcon,
  borderColor,
  borderWidth,
  chartStyleMode = ChartStyleMode.Normal,
  height,
  onChartLoad,
}: PieChartProps<SliceName, Y>) => {
  const theme = useTheme();
  const isChartInAbnormalState = useChartIsInAbnormalState();

  const series: SeriesPieOptions[] = useMemo(() => {
    if (isChartInAbnormalState) {
      return [];
    }

    const { series: pieSeries } = data;

    return [
      {
        id: pieSeries.id,
        name: pieSeries.name,
        type: ChartType.Pie,
        data: pieSeries.dataPoints.map(([name, value], idx) => ({
          name,
          y: value,
          color: pieSeries.dataPointColors?.[idx]
            ? getChartColorHexString(pieSeries.dataPointColors[idx], theme)
            : undefined,
        })),
        color: pieSeries.color ? getChartColorHexString(pieSeries.color, theme) : undefined,
        custom: pieSeries.custom,
      },
    ];
  }, [data, isChartInAbnormalState, theme]);

  const borderOptions = useMemo(() => {
    // NOTE(lucaswang, 2025-09-25): Remove border when only one data point is present to avoid visual bug
    return data.series.dataPoints.length > 1
      ? {
          borderColor,
          borderWidth,
        }
      : {};
  }, [borderColor, borderWidth, data.series.dataPoints.length]);

  const plotOptions = usePieChartPlotOptions({
    formatDataLabel,
    DataLabelLeadingIcon,
    ...borderOptions,
  });

  const chartOptions = usePieChartChartOptions({
    onChartLoad,
    chartStyleMode,
    height,
  });

  const tooltipOptions = usePieChartTooltipOptions({
    formatSeriesKeyForSlice: tooltipFormatters.formatSeriesKeyForSlice,
    formatSeriesValueForSlice: tooltipFormatters.formatSeriesValueForSlice,
  });

  const legendTitleAndCreditOptions = useLegendTitleAndCreditOptions({
    chartStyleMode,
  });
  const pieChartResponsiveRulesOptions = usePieChartResponsiveRulesOptions();

  const highchartsOptions = useMemo(() => {
    const options: Options = {
      series,
      plotOptions,
      chart: chartOptions,
      tooltip: tooltipOptions,
      responsive: {
        rules: pieChartResponsiveRulesOptions,
      },
      ...legendTitleAndCreditOptions,
    };

    return options;
  }, [
    series,
    plotOptions,
    chartOptions,
    tooltipOptions,
    pieChartResponsiveRulesOptions,
    legendTitleAndCreditOptions,
  ]);

  return <GenericSeriesChart options={highchartsOptions} showLocalizedTime={false} />;
};

export default React.memo(PieChart);
