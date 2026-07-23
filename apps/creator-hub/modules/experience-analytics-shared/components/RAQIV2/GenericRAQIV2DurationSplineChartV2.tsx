import type { FC } from 'react';
import { useMemo } from 'react';
import { ChartStyleMode, LineChart } from '@rbx/analytics-ui';
import useTimeSeriesChartYAxisConfig from '@modules/charts-generic/charts/hooks/useTimeSeriesChartYAxisConfig';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import useDurationChartData from '../../hooks/useDurationChartData';
import useMetricAwareYAxisFormatterEnabled from '../../hooks/useMetricAwareYAxisFormatterEnabled';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import formatAnalyticsNumber from '../../utils/analyticsNumberFormatter';
import getRenderableDurationSeries from '../../utils/getRenderableDurationSeries';
import DurationChartCardWrapper from './DurationChartCardWrapper';

const xAxisType = { type: 'linear' } as const;

const GenericRAQIV2DurationSplineChartV2: FC<GenericRAQIV2ChartProps> = (props) => {
  const {
    spec,
    chartStyleMode = ChartStyleMode.Normal,
    chartHeight,
    chartUpdatePolicy,
    renderWithoutPeripherals,
  } = props;
  const { metric } = spec;

  const hookData = useDurationChartData(props, ChartType.DurationSpline);
  const { chart, xAxisFormatter, translationDependencies } = hookData;

  const convertedData = useMemo(() => {
    return {
      series: getRenderableDurationSeries(chart.series).map(({ name, dataPoints: data, type }) => ({
        name,
        type,
        dataPoints: data.map(([x, y]): [number, number | null] => [x, y ?? null]),
      })),
    };
  }, [chart.series]);

  const enableMetricAwareYAxisFormatter = useMetricAwareYAxisFormatterEnabled();
  const yAxisConfig = useTimeSeriesChartYAxisConfig({
    unitSpec: chart.unit,
    translationDependencies,
    enableMetricAwareYAxisFormatter,
  });
  const yAxisConfigs = useMemo(() => [yAxisConfig], [yAxisConfig]);

  const tooltipFormatters = useMemo(
    () => ({
      formatSeriesKeyForPoint: ({ seriesName }: { seriesName: string }) => seriesName,
      formatSeriesValueForPoint: ({ y }: { y: number }) =>
        formatAnalyticsNumber(
          y,
          { metric, context: NumberContext.DataPoint },
          translationDependencies,
        ),
      formatXForPoint: (x: string | number) => xAxisFormatter({ value: x }),
    }),
    [metric, translationDependencies, xAxisFormatter],
  );
  const lineChartUpdateProps = useMemo(
    () => (chartUpdatePolicy ? { chartUpdatePolicy } : {}),
    [chartUpdatePolicy],
  );

  const chartComponent = useMemo(
    () => (
      <LineChart
        {...lineChartUpdateProps}
        data={convertedData}
        chartStyleMode={chartStyleMode}
        xAxisFormatter={xAxisFormatter}
        xAxisType={xAxisType}
        yAxisConfigs={yAxisConfigs}
        tooltipFormatters={tooltipFormatters}
        height={chartHeight}
      />
    ),
    [
      chartStyleMode,
      convertedData,
      chartHeight,
      lineChartUpdateProps,
      tooltipFormatters,
      xAxisFormatter,
      yAxisConfigs,
    ],
  );

  return renderWithoutPeripherals ? (
    chartComponent
  ) : (
    <DurationChartCardWrapper chartProps={props} hookData={hookData}>
      {chartComponent}
    </DurationChartCardWrapper>
  );
};

export default GenericRAQIV2DurationSplineChartV2;
