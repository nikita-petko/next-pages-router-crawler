import type { FC } from 'react';
import { useMemo } from 'react';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import useRAQIV2PredefinedWarnings from '../../hooks/useRAQIV2PredefinedWarnings';
import type { GenericRAQIV2MultiMetricChartProps } from '../../types/GenericRAQIV2ChartProps';
import type GenericRAQIV2ChartProps from '../../types/GenericRAQIV2ChartProps';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import chartTypeToGenericRAQIV2Chart from './chartTypeToGenericRAQIV2Chart';
import GenericRAQIV2MetricComparisonChart from './GenericRAQIV2MetricComparisonChart';

type RAQIV2GenericSingleMetricChartProps = GenericRAQIV2ChartProps & {
  chartType: Exclude<ChartType, ChartType.MultipleMetricSpline | ChartType.Table>;
};

type RAQIV2GenericMultiMetricsChartProps = GenericRAQIV2MultiMetricChartProps & {
  chartType: ChartType.MultipleMetricSpline;
};

export type RAQIV2GenericChartProps =
  | RAQIV2GenericSingleMetricChartProps
  | RAQIV2GenericMultiMetricsChartProps;

const RAQIV2GenericChart: FC<RAQIV2GenericChartProps> = (chartProps) => {
  const { chartType, spec, overlays, displayOptions } = chartProps;

  const chartSpecs: RAQIV2ChartSpec[] = useMemo(() => {
    if (chartType !== ChartType.MultipleMetricSpline) {
      return [spec];
    }
    return spec.metricSpec.map((metricSpec) => {
      return {
        ...spec,
        metric: metricSpec.metric,
        filter: metricSpec.filter,
      };
    });
  }, [chartType, spec]);
  const chartWarnings = useRAQIV2PredefinedWarnings(chartSpecs);
  const resolvedOverlays = overlays ?? spec.overlays;
  const resolvedDisplayOptions = displayOptions ?? spec.displayOptions;

  if (ChartType.MultipleMetricSpline !== chartType) {
    const Chart = chartTypeToGenericRAQIV2Chart(chartType);
    return (
      <Chart
        chartWarnings={chartWarnings}
        {...chartProps}
        overlays={resolvedOverlays}
        displayOptions={resolvedDisplayOptions}
      />
    );
  }
  return (
    <GenericRAQIV2MetricComparisonChart
      {...chartProps}
      overlays={resolvedOverlays}
      displayOptions={resolvedDisplayOptions}
    />
  );
};

export default RAQIV2GenericChart;
