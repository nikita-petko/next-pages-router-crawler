import { SeriesDataTypes } from '@rbx/analytics-ui';
import type { DurationSplineChartSeries } from '@modules/charts-generic/charts/types/DurationSplineChartTypes';

const getRenderableDurationSeries = (
  series: DurationSplineChartSeries,
): DurationSplineChartSeries => {
  const hasBreakdownSeries = series.some(({ type }) => type === SeriesDataTypes.Normal);

  return hasBreakdownSeries ? series.filter(({ type }) => type !== SeriesDataTypes.Total) : series;
};

export default getRenderableDurationSeries;
