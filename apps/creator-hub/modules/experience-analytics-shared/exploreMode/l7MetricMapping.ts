import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type { ComputedMetric, MetricLike } from '../types/ComputedMetric';

/**
 * Exhaustive list of [baseMetric, precomputedL7Metric] pairs.
 * Single source of truth — all maps, sets, and helpers derive from this array.
 */
const l7SmoothingMetricPairs = [
  [RAQIV2Metric.ForwardD1Retention, RAQIV2Metric.L7AverageForwardD1Retention],
  [RAQIV2Metric.ForwardD7Retention, RAQIV2Metric.L7AverageForwardD7Retention],
  [RAQIV2Metric.DailyRevenue, RAQIV2Metric.L7AverageDailyRevenue],
  [RAQIV2Metric.AverageRevenuePerPayingUser, RAQIV2Metric.L7AverageRevenuePerPayingUser],
  [RAQIV2Metric.PayingUsersCVR, RAQIV2Metric.L7AveragePayingUsersCVR],
  [RAQIV2Metric.DailyActiveUsers, RAQIV2Metric.L7AverageDailyActiveUsers],
  [RAQIV2Metric.AveragePlayTimeMinutesPerDAU, RAQIV2Metric.L7AveragePlayTimeMinutesPerDAU],
  [RAQIV2Metric.UniqueUsersWithPlaySessions, RAQIV2Metric.L7AverageUniqueUsersWithPlaySessions],
  [RAQIV2Metric.RFYQualifiedPTR, RAQIV2Metric.L7AverageRFYQualifiedPTR],
] as const satisfies ReadonlyArray<readonly [TRAQIV2NumericUIMetric, TRAQIV2NumericUIMetric]>;

type L7SmoothingPair = (typeof l7SmoothingMetricPairs)[number];

/** Union of all pre-computed L7 metric enum values. */
export type PrecomputedL7Metric = L7SmoothingPair[1];

/** Maps a base metric to its pre-computed L7 average counterpart. */
export const l7SmoothingMetricMap: Partial<Record<TRAQIV2NumericUIMetric, TRAQIV2NumericUIMetric>> =
  Object.fromEntries(l7SmoothingMetricPairs) as Partial<
    Record<TRAQIV2NumericUIMetric, TRAQIV2NumericUIMetric>
  >;

/** Exhaustive reverse map: every pre-computed L7 metric -> its base metric. */
export const reverseL7SmoothingMetricMap: Record<PrecomputedL7Metric, TRAQIV2NumericUIMetric> =
  Object.fromEntries(l7SmoothingMetricPairs.map(([base, l7]) => [l7, base])) as Record<
    PrecomputedL7Metric,
    TRAQIV2NumericUIMetric
  >;

/** Set of all pre-computed L7 metric keys (the L7 side of the pairs). */
export const precomputedL7Metrics: ReadonlySet<TRAQIV2NumericUIMetric> = new Set(
  l7SmoothingMetricPairs.map(([, l7]) => l7),
);

export const isPrecomputedL7Metric = (metric: string): metric is PrecomputedL7Metric =>
  precomputedL7Metrics.has(metric as TRAQIV2NumericUIMetric);

export const hasPrecomputedL7Metric = (metric: TRAQIV2NumericUIMetric): boolean =>
  metric in l7SmoothingMetricMap;

/**
 * Wraps a single metric in a minimal {@link ComputedMetric} whose only
 * operation is a 7-day rolling average via ACE.
 */
export const buildL7SmoothingComputedMetric = (
  metric: TRAQIV2NumericUIMetric,
): ComputedMetric<TRAQIV2NumericUIMetric> => ({
  sources: [{ key: 'A', metric }],
  formula: 'A',
  l7Smoothing: true,
});

/**
 * Given a base metric and whether L7 smoothing is active, returns the
 * pre-computed L7 metric when one exists, or a synthetic
 * {@link ComputedMetric} that applies a 7-day rolling average via ACE.
 */
export const getMetricForL7Smoothing = (
  metric: TRAQIV2NumericUIMetric,
  isSmoothingEnabled: boolean,
): MetricLike<TRAQIV2NumericUIMetric> => {
  if (!isSmoothingEnabled) {
    return metric;
  }
  const mappedMetric = l7SmoothingMetricMap[metric];
  if (mappedMetric) {
    return mappedMetric;
  }
  return buildL7SmoothingComputedMetric(metric);
};

/**
 * If `metric` is a pre-computed L7 metric, returns the corresponding base metric.
 * Otherwise returns `null`.
 */
export const getBaseMetricFromL7 = (metric: string): TRAQIV2NumericUIMetric | null => {
  if (!isPrecomputedL7Metric(metric)) {
    return null;
  }
  return reverseL7SmoothingMetricMap[metric];
};
