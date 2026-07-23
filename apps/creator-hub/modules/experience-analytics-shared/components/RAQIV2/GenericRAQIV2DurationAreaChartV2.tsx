import type { FC } from 'react';
import { useMemo } from 'react';
import type { SingleAreaSeries } from '@rbx/analytics-ui';
import { AreaChart, AreaSeriesDataTypes, ChartStyleMode, SeriesDataTypes } from '@rbx/analytics-ui';
import { numberFormatter } from '@rbx/core';
import buildAxisFormattingSpec from '@modules/charts-generic/charts/buildAxisFormattingSpec';
import formatChartUnit from '@modules/charts-generic/charts/formatChartUnit';
import { ChartType, ChartUnit } from '@modules/charts-generic/charts/types/ChartTypes';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import useDurationChartData from '../../hooks/useDurationChartData';
import useMetricAwareYAxisFormatterEnabled from '../../hooks/useMetricAwareYAxisFormatterEnabled';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import getRenderableDurationSeries from '../../utils/getRenderableDurationSeries';
import DurationChartCardWrapper from './DurationChartCardWrapper';

const xAxisType = { type: 'linear' } as const;

const GenericRAQIV2DurationAreaChartV2: FC<GenericRAQIV2ChartProps> = (props) => {
  const {
    chartHeight,
    renderWithoutPeripherals,
    chartStyleMode = ChartStyleMode.Normal,
    chartKeyOrConfig,
  } = props;

  const hookData = useDurationChartData(props, ChartType.DurationArea);
  const { chart, xAxisFormatter, translationDependencies } = hookData;

  const convertedData = useMemo(() => {
    const series: Array<SingleAreaSeries<number, number>> = [];
    const chartConfigLabel =
      typeof chartKeyOrConfig === 'string' ? chartKeyOrConfig : 'custom chart config';

    getRenderableDurationSeries(chart.series).forEach(({ name, dataPoints, type }) => {
      if (!isValidArrayEnumValue(AreaSeriesDataTypes, type)) {
        throw new Error(
          `Unsupported area series data type found in chart ${chartConfigLabel}: ${type}`,
        );
      }
      series.push({
        name,
        type: type === SeriesDataTypes.Total ? SeriesDataTypes.Normal : type,
        dataPoints: dataPoints.map(([x, y]): [number, number | null] => [x, y ?? null]),
      });
    });
    return { series };
  }, [chart.series, chartKeyOrConfig]);

  const enableMetricAwareYAxisFormatter = useMetricAwareYAxisFormatterEnabled();
  const yAxisConfig = useMemo(() => {
    // For percent units we keep the long-standing locale-aware percent
    // formatter. For everything else, the DSA-5725 metric-aware formatter is
    // gated behind `isAnalyticsMetricAwareYAxisFormatterEnabled`. When the
    // flag is off (or the unit lacks a `formattingSpec`), we omit the
    // formatter so axes use Highcharts' default formatter.
    const isPercentUnit =
      // eslint-disable-next-line deprecation/deprecation, @typescript-eslint/no-deprecated -- migration in progress. Will be removed in DSA-4660.
      chart.unit.unit === ChartUnit.Percentage ||
      chart.unit.formattingSpec?.numberFormatOptions.style === 'percent';
    if (isPercentUnit) {
      return {
        yAxisFormatter: ({ value }: { value: string | number }) => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          return `${numberFormatter(num, 'percent')}`;
        },
      };
    }
    if (!enableMetricAwareYAxisFormatter || !chart.unit.formattingSpec) {
      return {};
    }
    const axisUnit = {
      ...chart.unit,
      formattingSpec: buildAxisFormattingSpec(chart.unit.formattingSpec),
    };
    return {
      yAxisFormatter: ({ value }: { value: string | number }) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (!Number.isFinite(num)) {
          return '';
        }
        return formatChartUnit(num, axisUnit, translationDependencies);
      },
    };
  }, [chart.unit, enableMetricAwareYAxisFormatter, translationDependencies]);

  const tooltipFormatters = useMemo(
    () => ({
      formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => seriesName,
      formatSeriesValueForPoint: ({ y }: { y: number }) =>
        formatChartUnit(y, chart.unit, translationDependencies),
      formatXForPoint: (x: string | number) => xAxisFormatter({ value: x }),
    }),
    [chart.unit, translationDependencies, xAxisFormatter],
  );

  const chartComponent = useMemo(
    () => (
      <AreaChart
        data={convertedData}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfig={yAxisConfig}
        tooltipFormatters={tooltipFormatters}
        height={chartHeight}
      />
    ),
    [convertedData, chartStyleMode, xAxisFormatter, yAxisConfig, tooltipFormatters, chartHeight],
  );

  return renderWithoutPeripherals ? (
    chartComponent
  ) : (
    <DurationChartCardWrapper chartProps={props} hookData={hookData}>
      {chartComponent}
    </DurationChartCardWrapper>
  );
};

export default GenericRAQIV2DurationAreaChartV2;
