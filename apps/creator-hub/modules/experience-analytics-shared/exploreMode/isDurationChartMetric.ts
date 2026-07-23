import { ChartType } from '@modules/charts-generic';
import type { TExploreModeMetrics } from './exploreModeMetricsConfig';
import getMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';

const DURATION_CHART_TYPES: ReadonlySet<ChartType> = new Set([
  ChartType.DurationSpline,
  ChartType.DurationArea,
]);

/**
 * Duration chart metrics require a mandatory bucket breakdown dimension
 * (e.g. SessionTimeBucket, ServerAgeBucket) and granularity=None.
 * These requirements are incompatible with computed metrics, which
 * combine multiple metrics on a shared time-series axis.
 *
 * Used to filter duration metrics out of the computed metric equation builder
 * and to determine chart type compatibility in explore mode.
 */
const isDurationChartMetric = (metric: TExploreModeMetrics): boolean => {
  const { exploreModeChartType } = getMetricDisplayConfig(metric);
  return exploreModeChartType !== undefined && DURATION_CHART_TYPES.has(exploreModeChartType);
};

export default isDurationChartMetric;
