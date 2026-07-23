import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';

const chartConfiguratorSupportedChartTypes = [
  ChartType.Spline,
  ChartType.Area,
  ChartType.Column,
  ChartType.DurationSpline,
  ChartType.DurationArea,
  ChartType.Bar,
  ChartType.Pie,
  ChartType.Table,
] as const;

export type ChartConfiguratorChartType = (typeof chartConfiguratorSupportedChartTypes)[number];

export const isChartConfiguratorSupportedChartType = (
  chartType: ChartType,
): chartType is ChartConfiguratorChartType => {
  return chartConfiguratorSupportedChartTypes.some(
    (supportedChartType) => supportedChartType === chartType,
  );
};

export default chartConfiguratorSupportedChartTypes;
