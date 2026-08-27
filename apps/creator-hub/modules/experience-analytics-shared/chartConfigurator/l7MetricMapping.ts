import {
  RAQIV2BenchmarkVariantId,
  RAQIV2BenchmarkVariantsByMetric,
  RAQIV2BenchmarkDatasetKeyToVariant,
  RAQIV2Metric,
  RAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import type {
  TRAQIV2UIMetric,
  TRAQIV2UIMetricFanoutDimensionValues,
} from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import type {
  AtomicMetricLike,
  ComputedMetric,
  ComputedMetricSource,
  MetricLike,
} from '../types/ComputedMetric';
import { hasPseudoDimensionValues } from '../utils/extractPseudoDimensionsFromFilters';

/**
 * Leftover L7 overlay dataset keys. The published reverse index is typed
 * `Record<RAQIV2BenchmarkDatasetKey, ...>`, a separate enum from `RAQIV2Metric`,
 * so Hub keeps this list as the leftover-name union. `Extract` keeps those
 * names assignable to `RAQIV2Metric` while 0.1.466 still ships the matching
 * enum members. Insights, titles, and URL ingest use these names. Benchmark
 * API requests use `{ base metric, benchmarkVariantId }` from
 * `getBenchmarkRequestIdentityFromMetricLike` instead.
 */
export const leftoverL7DatasetNames = [
  'L7AverageDailyActiveUsers',
  'L7AverageDailyRevenue',
  'L7AverageForwardD1Retention',
  'L7AverageForwardD7Retention',
  'L7AveragePayingUsersCVR',
  'L7AveragePlayTimeMinutesPerDAU',
  'L7AverageRFYPlayThroughRate',
  'L7AverageRFYQualifiedPTR',
  'L7AverageRevenuePerPayingUser',
  'L7AverageUniqueUsersWithPlaySessions',
] as const;

export type LeftoverL7DatasetName = (typeof leftoverL7DatasetNames)[number];

export type PrecomputedL7Metric = Extract<RAQIV2Metric, LeftoverL7DatasetName>;

const leftoverL7DatasetNameSet: ReadonlySet<string> = new Set(leftoverL7DatasetNames);

export const isPrecomputedL7Metric = (metric: string): metric is PrecomputedL7Metric =>
  Object.hasOwn(RAQIV2BenchmarkDatasetKeyToVariant, metric) && leftoverL7DatasetNameSet.has(metric);

/** Reverse map: leftover L7 dataset key -> its base metric. */
export const reverseL7SmoothingMetricMap: Partial<
  Record<PrecomputedL7Metric, TRAQIV2NumericUIMetric>
> = Object.entries(RAQIV2BenchmarkDatasetKeyToVariant).reduce<
  Partial<Record<PrecomputedL7Metric, TRAQIV2NumericUIMetric>>
>((metricMap, [leftoverName, mapping]) => {
  if (!isPrecomputedL7Metric(leftoverName) || !isNumericUIMetric(mapping.metric)) {
    return metricMap;
  }
  metricMap[leftoverName] = mapping.metric;
  return metricMap;
}, {});

/** Set of leftover L7 dataset keys. Overlay identity, not ACE smoothing eligibility. */
export const precomputedL7Metrics: ReadonlySet<string> = new Set(
  Object.keys(RAQIV2BenchmarkDatasetKeyToVariant),
);

/**
 * Published benchmark variant mapping for a leftover L7 dataset key. The
 * registry map is keyed by `RAQIV2BenchmarkDatasetKey`, a separate enum from
 * `RAQIV2Metric`, so this localizes the string-keyed lookup for callers that
 * have already been narrowed by {@link isPrecomputedL7Metric}.
 */
export const getBenchmarkVariantByDatasetKey = (
  datasetKey: PrecomputedL7Metric,
): { metric: RAQIV2Metric; variantId: RAQIV2BenchmarkVariantId } | undefined =>
  (
    RAQIV2BenchmarkDatasetKeyToVariant as Record<
      string,
      { metric: RAQIV2Metric; variantId: RAQIV2BenchmarkVariantId } | undefined
    >
  )[datasetKey];

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
 * Given a base metric and whether L7 smoothing is active, returns either
 * the base metric (when smoothing is disabled) or a synthetic
 * {@link ComputedMetric} that applies a 7-day rolling average via ACE.
 *
 * Source options are forwarded onto the ComputedMetric source so downstream
 * DAG construction can resolve the source to the correct event and
 * underlying API metric.
 */
export const getMetricForL7Smoothing = (
  metric: TRAQIV2NumericUIMetric,
  isSmoothingEnabled: boolean,
  options: L7SmoothingComputedMetricSourceOptions | undefined,
): MetricLike => {
  if (!isSmoothingEnabled) {
    return buildAtomicMetricLike(metric, options);
  }
  return buildL7SmoothingComputedMetric(metric, options);
};

/**
 * A computed metric whose formula is a passthrough of a single source
 * (`{ sources: [{ key: K, metric }], formula: K }`). An identity formula
 * has no user-authored expression that could fail — execution failures are
 * upstream-query-only — so error classification renders the generic
 * "request failed" copy rather than the computed-metric "Unable to compute
 * this formula …" copy. This covers both pure L7 smoothing (single-source
 * identity + `l7Smoothing`, see {@link isPureL7SmoothingComputedMetric})
 * and the plain toggle-ON seed (single-source identity without
 * `l7Smoothing`). A user-authored formula with L7 smoothing enabled
 * (e.g. `formula: 'A / B', l7Smoothing: true`) does NOT match — those
 * still evaluate the formula in the DAG and can fail on the formula
 * itself.
 */
export const isIdentityFormulaComputedMetric = (metric: ComputedMetric): boolean => {
  if (metric.sources.length !== 1) {
    return false;
  }
  return metric.formula.trim() === metric.sources[0].key;
};

/**
 * A "pure L7 smoothing" ComputedMetric is a single-source identity formula
 * (`{ sources: [{ key: K, metric }], formula: K, l7Smoothing: true }`)
 * produced by {@link buildL7SmoothingComputedMetric}. Its output is unitarily
 * the rolling average of one underlying metric, so it should render with that
 * metric's units and formatting (Robux icon, percentage scaling, decimal
 * precision, suffix, etc.) rather than the neutral computed-metric fallback
 * used for arbitrary equations. Delegates to
 * {@link isIdentityFormulaComputedMetric} for the structural check.
 */
export const isPureL7SmoothingComputedMetric = (metric: ComputedMetric): boolean =>
  Boolean(metric.l7Smoothing) && isIdentityFormulaComputedMetric(metric);

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

/**
 * If `metric` is a base metric with a leftover L7 benchmark dataset, returns
 * that leftover dataset key. Otherwise returns `null`.
 *
 * Overlay eligibility comes from the CAaaS registry leftover name. ACE
 * smoothing can still apply to metrics with no leftover dataset.
 */
export const getPrecomputedL7MetricFromBase = (metric: string): PrecomputedL7Metric | null => {
  if (!isValidEnumValue(RAQIV2Metric, metric)) {
    return null;
  }
  const leftoverName =
    RAQIV2BenchmarkVariantsByMetric[metric]?.[RAQIV2BenchmarkVariantId.L7Average]?.datasetKey;
  return leftoverName && isPrecomputedL7Metric(leftoverName) ? leftoverName : null;
};

/**
 * Request-boundary compatibility rewrite for leftover `L7Average*` identities.
 *
 * Old Explore URLs and leftover ingest still carry the precomputed L7 name.
 * Query execution cannot: those CAaaS definitions are gone, so this converts
 * the leftover name into the ACE seven-day rolling-window {@link ComputedMetric}
 * that now backs it. Predefined L7 charts already put that ComputedMetric on
 * `spec.metric` and do not go through this rewrite.
 *
 * Returns `null` for everything else (computed metrics, custom-event atomics,
 * and non-L7 strings). The lookup is a small-set check, so calling this on
 * every request metric is cheap. Add additional identity rewrites here rather
 * than inlining them into request dispatch.
 */
export const rewritePrecomputedL7MetricForRequest = (
  metric: MetricLike<TRAQIV2UIMetric> | LeftoverL7DatasetName,
): ComputedMetric | null => {
  if (typeof metric !== 'string') {
    return null;
  }
  const baseMetric = getBaseMetricFromL7(metric);
  if (!baseMetric) {
    return null;
  }
  return buildL7SmoothingComputedMetric(baseMetric, undefined);
};
