import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import getMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import type { TChartConfiguratorMetrics } from './chartConfiguratorMetricsConfig';

export const DURATION_CHART_TYPES: ReadonlySet<ChartType> = new Set([
  ChartType.DurationSpline,
  ChartType.DurationArea,
]);

export const isDurationChartType = (type: ChartType | undefined | null): boolean =>
  type !== undefined && type !== null && DURATION_CHART_TYPES.has(type);

/**
 * Duration chart metrics require a mandatory bucket breakdown dimension
 * (e.g. SessionTimeBucket, ServerAgeBucket) and granularity=None.
 * These requirements are incompatible with computed metrics, which
 * combine multiple metrics on a shared time-series axis.
 *
 * Used to filter duration metrics out of the computed metric equation builder
 * and to determine chart type compatibility in explore mode.
 */
const isDurationChartMetric = (metric: TChartConfiguratorMetrics): boolean =>
  isDurationChartType(getMetricDisplayConfig(metric).exploreModeChartType);

export default isDurationChartMetric;
