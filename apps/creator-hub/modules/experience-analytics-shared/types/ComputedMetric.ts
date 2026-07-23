import {
  RAQIV2AggregationType,
  RAQIV2UIMetric,
  type RAQIV2Dimension,
  type TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetricFanoutDimensionValues } from '@rbx/creator-hub-analytics-config';
import type { QueryFilter as RAQIV2APIQueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';

/**
 * Filter shape accepted by {@link ComputedMetricSource.filters}.
 *
 * Structurally excludes the three carriers that must NEVER appear in a
 * source's real-filter slot:
 *  - `RAQIV2UIPseudoDimension.AggregationType` and `PercentileType`
 *    (metric-fanout pseudo-dimensions — already gone, since this type uses
 *    the API filter shape rather than the UI union).
 *  - `RAQIV2Dimension.CustomEventName` (source identity — belongs on the
 *    atomic `CustomEventsAtomicMetricLike.customEventName` instead).
 *
 * Producers that need to express any of those selections must use the
 * dedicated fields on the source (`metric` for CustomEventsV2 identity,
 * `pseudoDimensionValues` for fanout selections). The DAG builder relies
 * on this invariant and does not scan `filters` for them.
 */
export type ComputedMetricSourceFilter = Omit<RAQIV2APIQueryFilter, 'dimension'> & {
  dimension: Exclude<RAQIV2APIQueryFilter['dimension'], RAQIV2Dimension.CustomEventName>;
};

export type CustomEventsAtomicMetricLike = {
  metric: typeof RAQIV2UIMetric.CustomEventsV2;
  customEventName: string;
  aggregationType?: RAQIV2AggregationType;
};

export type AtomicMetricLike<TMetric extends TRAQIV2UIMetric = TRAQIV2NumericUIMetric> =
  | TMetric
  | CustomEventsAtomicMetricLike;

export type ComputedMetricSource<TMetric extends TRAQIV2UIMetric = TRAQIV2NumericUIMetric> = {
  key: string;
  metric: AtomicMetricLike<TMetric>;
  // Real query filters only. Producers MUST NOT place metric-fanout
  // pseudo-dimension selections (AggregationType, PercentileType) or source
  // identity selections (CustomEventName) here — those belong on the atomic
  // metric identity and typed fanout fields. The element type structurally
  // enforces this: see {@link ComputedMetricSourceFilter}.
  filters?: readonly ComputedMetricSourceFilter[];
  // Authoritative carrier for metric-fanout pseudo-dimension selections
  // not represented on the atomic itself (e.g. PercentileType). CustomEventsV2
  // AggregationType lives on the atomic because it is part of that source's
  // identity in simple and computed queries. Populated by every producer:
  // the L7-smoothing helper, the equation builder, and the URL-param
  // deserializer. Omitted when no fanout selection has been made.
  pseudoDimensionValues?: TRAQIV2UIMetricFanoutDimensionValues;
};

export type ComputedMetric<TMetric extends TRAQIV2UIMetric = TRAQIV2NumericUIMetric> = {
  sources: readonly [ComputedMetricSource<TMetric>, ...ComputedMetricSource<TMetric>[]];
  formula: string;
  name?: string;
  l7Smoothing?: boolean;
};

export type MetricLike<TMetric extends TRAQIV2UIMetric = TRAQIV2NumericUIMetric> =
  | AtomicMetricLike<TMetric>
  | ComputedMetric<Extract<TMetric, TRAQIV2NumericUIMetric>>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const isCustomEventsAtomicMetricLike = (
  metric: unknown,
): metric is CustomEventsAtomicMetricLike => {
  if (!metric || typeof metric !== 'object') {
    return false;
  }
  const candidate = metric as Partial<CustomEventsAtomicMetricLike>;
  return (
    candidate.metric === RAQIV2UIMetric.CustomEventsV2 &&
    isNonEmptyString(candidate.customEventName) &&
    (candidate.aggregationType === undefined ||
      Object.values(RAQIV2AggregationType).includes(candidate.aggregationType))
  );
};

const isNumericUIMetricFromUnknown = (metric: unknown): metric is TRAQIV2NumericUIMetric =>
  isNonEmptyString(metric) && isNumericUIMetric(metric);

export const isAtomicMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metric: unknown,
): metric is AtomicMetricLike<TMetric> =>
  isNumericUIMetricFromUnknown(metric) || isCustomEventsAtomicMetricLike(metric);

/**
 * Reduce an {@link AtomicMetricLike} to its UI metric identifier.
 *
 * The return type tracks both branches of the union precisely:
 *  - The CustomEvents wrapper always yields the `CustomEventsV2` literal.
 *  - The bare branch yields `TMetric` unchanged.
 *
 * Returning the union (instead of the wider `TRAQIV2UIMetric`) lets every
 * caller whose `TMetric` already includes `CustomEventsV2` — i.e. anyone
 * using the default `TRAQIV2NumericUIMetric` — collapse the result back to
 * `TMetric` automatically, with no `as` cast at the call site.
 */
export const getUIMetricFromAtomicMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metric: AtomicMetricLike<TMetric>,
): TMetric | typeof RAQIV2UIMetric.CustomEventsV2 =>
  isCustomEventsAtomicMetricLike(metric) ? metric.metric : metric;

const isComputedMetricSourceShape = (source: unknown): source is ComputedMetricSource => {
  if (!source || typeof source !== 'object') {
    return false;
  }
  const candidate = source as Partial<ComputedMetricSource>;
  return isNonEmptyString(candidate.key) && isAtomicMetricLike(candidate.metric);
};

export const isComputedMetric = (
  value: MetricLike<TRAQIV2UIMetric> | null | undefined,
): value is ComputedMetric => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  // `MetricLike` is a distinguished union: after ruling out nullish and the
  // primitive (bare-string atomic) branch, only `ComputedMetric` carries a
  // `sources` property — `CustomEventsAtomicMetricLike` does not. Use that
  // native discriminator instead of a `Partial<...>` cast.
  if (!('sources' in value)) {
    return false;
  }
  if (!Array.isArray(value.sources) || value.sources.length === 0) {
    return false;
  }
  if (!isNonEmptyString(value.formula)) {
    return false;
  }
  return value.sources.every(isComputedMetricSourceShape);
};

export const assertAtomicMetric = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): AtomicMetricLike<TMetric> => {
  if (isComputedMetric(metricLike)) {
    throw new Error('Expected an atomic metric but received a computed metric');
  }
  return metricLike;
};

export const getUIMetricsFromMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): (TMetric | typeof RAQIV2UIMetric.CustomEventsV2)[] => {
  if (!isComputedMetric(metricLike)) {
    return [getUIMetricFromAtomicMetricLike(metricLike)];
  }
  const seen = new Set<TMetric | typeof RAQIV2UIMetric.CustomEventsV2>();
  metricLike.sources.forEach((source) => {
    seen.add(getUIMetricFromAtomicMetricLike(source.metric));
  });
  return Array.from(seen);
};

export const getMetricCacheKeyFromAtomicMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metric: AtomicMetricLike<TMetric>,
): string => {
  if (!isCustomEventsAtomicMetricLike(metric)) {
    return metric;
  }
  const aggregationType = metric.aggregationType ?? RAQIV2AggregationType.Sum;
  return `${metric.metric}:${metric.customEventName}:${aggregationType}`;
};

export const atomicMetricLikeEquals = <TMetric extends TRAQIV2UIMetric>(
  left: AtomicMetricLike<TMetric>,
  right: AtomicMetricLike<TMetric>,
): boolean =>
  getMetricCacheKeyFromAtomicMetricLike(left) === getMetricCacheKeyFromAtomicMetricLike(right);

export const getAtomicMetricLikesFromMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): AtomicMetricLike<TMetric>[] => {
  if (!isComputedMetric(metricLike)) {
    return [metricLike];
  }
  const seen = new Set<string>();
  const atomicMetrics: AtomicMetricLike<TMetric>[] = [];
  metricLike.sources.forEach((source) => {
    const key = getMetricCacheKeyFromAtomicMetricLike(source.metric as AtomicMetricLike<TMetric>);
    if (!seen.has(key)) {
      seen.add(key);
      atomicMetrics.push(source.metric as AtomicMetricLike<TMetric>);
    }
  });
  return atomicMetrics;
};

export const getMetricCacheKeyFromMetricLike = (
  metricLike: MetricLike<TRAQIV2UIMetric>,
): string => {
  if (!isComputedMetric(metricLike)) {
    return getMetricCacheKeyFromAtomicMetricLike(metricLike);
  }
  return `ACEComputed:${getAtomicMetricLikesFromMetricLike(metricLike)
    .map((metric) => getMetricCacheKeyFromAtomicMetricLike(metric))
    .sort()
    .join('|')}`;
};

export const getAtomicMetricsFromMetricLike = getUIMetricsFromMetricLike;

export const getSentryMetricNameFromMetricLike = (
  metricLike: MetricLike<TRAQIV2UIMetric>,
): string => {
  return getMetricCacheKeyFromMetricLike(metricLike);
};
