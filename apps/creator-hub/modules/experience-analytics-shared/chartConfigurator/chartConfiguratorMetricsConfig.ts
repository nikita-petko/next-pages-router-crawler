import type { TRAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { RAQIV2Metric, RAQIV2MetricDisplayConfig } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';

/**
 * Derived from the codegen metric type, narrowed to numeric UI metrics
 * (excludes non-numeric metrics like ThumbnailWinningSegments that never
 * appear in the chart configurator catalog).
 */
export type TChartConfiguratorMetrics = TRAQIV2NumericUIMetric;

/** Backed by legacy `exploreMode` entries in RAQIV2MetricDisplayConfig. */
const isChartConfiguratorEnabledMetric = (metric: TRAQIV2Metric): boolean => {
  const config = RAQIV2MetricDisplayConfig[metric];
  return !!config.exploreMode && !config.exploreMode.disabled;
};

/** Metrics eligible for chart configuration per codegen display config, alphabetized. */
export const getAllChartConfiguratorMetrics = (): TChartConfiguratorMetrics[] =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- RAQI metric display config keys are generated from TRAQIV2Metric.
  (Object.keys(RAQIV2MetricDisplayConfig) as TRAQIV2Metric[])
    .filter((m): m is TChartConfiguratorMetrics => isChartConfiguratorEnabledMetric(m))
    .sort((a, b) => a.localeCompare(b));

export const isChartConfiguratorMetric = (
  input: string | number,
): input is TChartConfiguratorMetrics =>
  typeof input === 'string' &&
  input in RAQIV2MetricDisplayConfig &&
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- guarded by the generated display config key check above.
  isChartConfiguratorEnabledMetric(input as TRAQIV2Metric);

export const chartConfiguratorDefaultMetric: TChartConfiguratorMetrics =
  RAQIV2Metric.DailyActiveUsers;

/** Chart-configurator metrics marked `excluded: true` in codegen (hidden by default). */
export const getChartConfiguratorExcludedMetrics = (): TChartConfiguratorMetrics[] =>
  getAllChartConfiguratorMetrics().filter((metric) => {
    const cfg = RAQIV2MetricDisplayConfig[metric];
    return cfg.exploreMode && !cfg.exploreMode.disabled && cfg.exploreMode.excluded;
  });
