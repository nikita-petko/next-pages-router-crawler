import { RAQIV2Metric, RAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetricFanoutDimensionValues } from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type {
  AtomicMetricLike,
  ComputedMetric,
  ComputedMetricSource,
  MetricLike,
} from '../types/ComputedMetric';
import { hasPseudoDimensionValues } from '../utils/extractPseudoDimensionsFromFilters';

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
  l7SmoothingMetricPairs.reduce<Partial<Record<TRAQIV2NumericUIMetric, TRAQIV2NumericUIMetric>>>(
    (metricMap, [baseMetric, precomputedMetric]) => {
      metricMap[baseMetric] = precomputedMetric;
      return metricMap;
    },
    {},
  );

/** Reverse map: every pre-computed L7 metric -> its base metric. */
export const reverseL7SmoothingMetricMap: Partial<
  Record<PrecomputedL7Metric, TRAQIV2NumericUIMetric>
> = l7SmoothingMetricPairs.reduce<Partial<Record<PrecomputedL7Metric, TRAQIV2NumericUIMetric>>>(
  (metricMap, [baseMetric, precomputedMetric]) => {
    metricMap[precomputedMetric] = baseMetric;
    return metricMap;
  },
  {},
);

/** Set of all pre-computed L7 metric keys (the L7 side of the pairs). */
export const precomputedL7Metrics: ReadonlySet<string> = new Set(
  l7SmoothingMetricPairs.map(([, l7]) => l7),
);

export const isPrecomputedL7Metric = (metric: string): metric is PrecomputedL7Metric =>
  precomputedL7Metrics.has(metric);

export const hasPrecomputedL7Metric = (metric: TRAQIV2NumericUIMetric): boolean =>
  metric in l7SmoothingMetricMap;

type L7SmoothingComputedMetricSourceOptions = {
  customEventName?: string;
  pseudoDimensionValues?: TRAQIV2UIMetricFanoutDimensionValues;
};

const buildAtomicMetricLike = (
  metric: TRAQIV2NumericUIMetric,
  options: L7SmoothingComputedMetricSourceOptions | undefined,
): AtomicMetricLike => {
  if (metric !== RAQIV2UIMetric.CustomEventsV2 || !options?.customEventName) {
    return metric;
  }
  return {
    metric,
    customEventName: options.customEventName,
    ...(options.pseudoDimensionValues?.aggregationType
      ? { aggregationType: options.pseudoDimensionValues.aggregationType }
      : {}),
  };
};

const buildL7SmoothingComputedMetricSource = (
  metric: TRAQIV2NumericUIMetric,
  options: L7SmoothingComputedMetricSourceOptions | undefined,
): ComputedMetricSource => {
  const source: ComputedMetricSource = {
    key: 'A',
    metric: buildAtomicMetricLike(metric, options),
  };

  if (options?.pseudoDimensionValues && hasPseudoDimensionValues(options.pseudoDimensionValues)) {
    source.pseudoDimensionValues = options.pseudoDimensionValues;
  }

  return source;
};

/**
 * Wraps a single metric in a minimal {@link ComputedMetric} whose only
 * operation is a 7-day rolling average via ACE.
 *
 * Source identity and fanout selections are explicit source options so
 * downstream DAG construction can resolve the source to the correct event
 * and underlying API metric.
 */
export const buildL7SmoothingComputedMetric = (
  metric: TRAQIV2NumericUIMetric,
  options: L7SmoothingComputedMetricSourceOptions | undefined,
): ComputedMetric => {
  return {
    sources: [buildL7SmoothingComputedMetricSource(metric, options)],
    formula: 'A',
    l7Smoothing: true,
  };
};

/**
 * Given a base metric and whether L7 smoothing is active, returns the
 * pre-computed L7 metric when one exists, or a synthetic
 * {@link ComputedMetric} that applies a 7-day rolling average via ACE.
 *
 * Source options are ignored for the pre-computed L7 path (those API metrics
 * encode the aggregation in the metric name itself).
 */
export const getMetricForL7Smoothing = (
  metric: TRAQIV2NumericUIMetric,
  isSmoothingEnabled: boolean,
  options: L7SmoothingComputedMetricSourceOptions | undefined,
): MetricLike => {
  if (!isSmoothingEnabled) {
    return buildAtomicMetricLike(metric, options);
  }
  const mappedMetric = l7SmoothingMetricMap[metric];
  if (mappedMetric) {
    return mappedMetric;
  }
  return buildL7SmoothingComputedMetric(metric, options);
};

/**
 * If `metric` is a pre-computed L7 metric, returns the corresponding base metric.
 * Otherwise returns `null`.
 */
export const getBaseMetricFromL7 = (metric: string): TRAQIV2NumericUIMetric | null => {
  if (!isPrecomputedL7Metric(metric)) {
    return null;
  }
  return reverseL7SmoothingMetricMap[metric] ?? null;
};
