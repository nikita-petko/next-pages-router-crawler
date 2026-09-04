import React, { useCallback, useMemo, useState } from 'react';
import type { Chart, Options, SeriesPieOptions } from 'highcharts';
import type { TIconProps } from '@rbx/ui';
import { Typography, useTheme } from '@rbx/ui';
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
import type { ChartDependencyStatus } from './types/BaseChart';
import { ChartStyleMode, ChartType } from './types/BaseChart';
import type { PieDonutOptions, SinglePieSeries } from './types/PieChart';

const RootClassName = 'relative width-full';
/** Used until Highcharts reports the pie geometry (for example during SSR). */
const UnpositionedCenterOverlayClassName =
  'absolute [inset:0] flex flex-col items-center justify-center [pointer-events:none]';
/**
 * Anchored on the pie's own center, which is offset from the container by chart
 * spacing and the legend, so the hole text stays centered in the donut.
 */
const PositionedCenterOverlayClassName =
  'absolute flex flex-col items-center justify-center [pointer-events:none] [transform:translate(-50%,-50%)]';
/** Ignore sub-pixel jitter so the render handler cannot loop. */
const CENTER_POSITION_EPSILON_PX = 0.5;
type CenterPosition = { x: number; y: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUnknownArray = (value: unknown): value is readonly unknown[] => Array.isArray(value);

/**
 * Highcharts' public `Series` type does not expose the pie-only `center`
 * tuple (`[x, y, diameter, innerDiameter]`), so read it defensively.
 */
const readPieCenterPosition = (chart: Chart): CenterPosition | null => {
  const series: unknown = chart.series?.[0];
  if (!isRecord(series)) {
    return null;
  }

  const { center } = series;
  if (!isUnknownArray(center)) {
    return null;
  }

  const [x, y] = center;
  if (typeof x !== 'number' || typeof y !== 'number') {
    return null;
  }

  return { x: chart.plotLeft + x, y: chart.plotTop + y };
};

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
   * When true, `formatDataLabel` text is drawn outside the pie instead of inside
   * each slice.
   */
  dataLabelsOutside?: boolean;

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

  /**
   * Optional donut hole and isolated center text.
   */
  donut?: PieDonutOptions;

  chartStyleMode?: ChartStyleMode;
  /**
   * If not specified, the chart will be rendered with a chartStyleMode dependent default height
   */
  height?: number;

  onChartLoad?: () => void;
  onChartRender?: () => void;
  onChartDependencyStatus?: (status: ChartDependencyStatus) => void;
};

const PieChart = <SliceName extends string, Y extends number>({
  data,
  tooltipFormatters,
  formatDataLabel,
  dataLabelsOutside = false,
  DataLabelLeadingIcon,
  borderColor,
  borderWidth,
  donut,
  chartStyleMode = ChartStyleMode.Normal,
  height,
  onChartLoad,
  onChartRender,
  onChartDependencyStatus,
}: PieChartProps<SliceName, Y>) => {
  const theme = useTheme();
  const isChartInAbnormalState = useChartIsInAbnormalState();
  const [centerPosition, setCenterPosition] = useState<CenterPosition | null>(null);

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
    dataLabelsOutside,
    innerSize: donut?.innerSize,
    ...borderOptions,
  });

  const handleChartRender = useCallback(
    function handleChartRender(this: Chart) {
      const nextPosition = readPieCenterPosition(this);
      if (nextPosition) {
        setCenterPosition((previousPosition) => {
          if (
            previousPosition &&
            Math.abs(previousPosition.x - nextPosition.x) < CENTER_POSITION_EPSILON_PX &&
            Math.abs(previousPosition.y - nextPosition.y) < CENTER_POSITION_EPSILON_PX
          ) {
            return previousPosition;
          }
          return nextPosition;
        });
      }

      onChartRender?.();
    },
    [onChartRender],
  );

  const chartOptions = usePieChartChartOptions({
    onChartLoad,
    onChartRender: handleChartRender,
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

  const chart = (
    <GenericSeriesChart
      options={highchartsOptions}
      showLocalizedTime={false}
      onChartDependencyStatus={onChartDependencyStatus}
    />
  );

  const hasCenterContent = Boolean(donut?.centerLabel ?? donut?.centerSubLabel);
  if (!hasCenterContent) {
    return chart;
  }

  return (
    <div className={RootClassName}>
      {chart}
      <div
        className={
          centerPosition ? PositionedCenterOverlayClassName : UnpositionedCenterOverlayClassName
        }
        style={centerPosition ? { left: centerPosition.x, top: centerPosition.y } : undefined}
        aria-hidden>
        {donut?.centerSubLabel ? (
          <Typography variant='h6' className='content-muted text-align-x-center'>
            {donut.centerSubLabel}
          </Typography>
        ) : null}
        {donut?.centerLabel ? (
          <Typography variant='h1' className='text-align-x-center'>
            {donut.centerLabel}
          </Typography>
        ) : null}
      </div>
    </div>
  );
};

export default React.memo(PieChart);
