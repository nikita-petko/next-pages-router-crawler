import {
  RAQIV2Metric,
  RAQIV2MetricDisplayConfig,
  TRAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';

/**
 * Derived from the codegen metric type, narrowed to numeric UI metrics
 * (excludes non-numeric metrics like ThumbnailWinningSegments that never
 * appear in explore mode).
 */
export type TExploreModeMetrics = TRAQIV2NumericUIMetric;

const hasExploreModeEnabled = (metric: TRAQIV2Metric): boolean => {
  const config = RAQIV2MetricDisplayConfig[metric];
  return !!config.exploreMode && !config.exploreMode.disabled;
};

/** All metrics whose codegen config includes an `exploreMode` entry that is not disabled, alphabetized. */
export const getAllExploreModeMetrics = (): TExploreModeMetrics[] =>
  (Object.keys(RAQIV2MetricDisplayConfig) as TRAQIV2Metric[])
    .filter((m): m is TExploreModeMetrics => hasExploreModeEnabled(m))
    .sort((a, b) => a.localeCompare(b));

export const isExploreModeMetric = (input: string | number): input is TExploreModeMetrics =>
  typeof input === 'string' &&
  input in RAQIV2MetricDisplayConfig &&
  hasExploreModeEnabled(input as TRAQIV2Metric);

export const exploreModeDefaultMetric: TExploreModeMetrics = RAQIV2Metric.DailyActiveUsers;

/** Explore-mode metrics marked `excluded: true` in codegen (hidden by default). */
export const getExploreModeExcludedMetrics = (): TExploreModeMetrics[] =>
  getAllExploreModeMetrics().filter((metric) => {
    const cfg = RAQIV2MetricDisplayConfig[metric];
    return cfg.exploreMode && !cfg.exploreMode.disabled && cfg.exploreMode.excluded;
  });
