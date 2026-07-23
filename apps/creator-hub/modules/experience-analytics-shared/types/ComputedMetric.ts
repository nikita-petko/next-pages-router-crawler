import type { RAQIV2QueryFilter } from '@modules/clients/analytics';
import { type TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';

export type ComputedMetricSource<TMetric extends TRAQIV2UIMetric = TRAQIV2NumericUIMetric> = {
  key: string;
  metric: TMetric;
  filters?: readonly RAQIV2QueryFilter[];
};

export type ComputedMetric<TMetric extends TRAQIV2UIMetric = TRAQIV2NumericUIMetric> = {
  sources: readonly [ComputedMetricSource<TMetric>, ...ComputedMetricSource<TMetric>[]];
  formula: string;
  name?: string;
  l7Smoothing?: boolean;
};

export type MetricLike<TMetric extends TRAQIV2UIMetric = TRAQIV2NumericUIMetric> =
  | TMetric
  | ComputedMetric<Extract<TMetric, TRAQIV2NumericUIMetric>>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNumericUIMetricFromUnknown = (metric: unknown): metric is TRAQIV2NumericUIMetric =>
  isNonEmptyString(metric) && isNumericUIMetric(metric);

export const isComputedMetric = (
  value: MetricLike<TRAQIV2UIMetric> | null | undefined,
): value is ComputedMetric<TRAQIV2NumericUIMetric> => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<ComputedMetric<TRAQIV2NumericUIMetric>>;
  const { sources } = candidate;
  if (!Array.isArray(sources) || sources.length === 0) {
    return false;
  }
  if (!isNonEmptyString(candidate.formula)) {
    return false;
  }
  return sources.every(
    (source) =>
      Boolean(source) &&
      typeof source === 'object' &&
      isNonEmptyString(source.key) &&
      isNumericUIMetricFromUnknown(source.metric),
  );
};

export const assertAtomicMetric = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): TMetric => {
  if (isComputedMetric(metricLike)) {
    throw new Error('Expected an atomic metric but received a computed metric');
  }
  return metricLike;
};

export const getAtomicMetricsFromMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): TMetric[] => {
  if (!isComputedMetric(metricLike)) {
    return [metricLike];
  }
  const seen = new Set<TMetric>();
  metricLike.sources.forEach((source) => {
    seen.add(source.metric as TMetric);
  });
  return Array.from(seen);
};

export const getSentryMetricNameFromMetricLike = (
  metricLike: MetricLike<TRAQIV2UIMetric>,
): string => {
  if (!isComputedMetric(metricLike)) {
    return metricLike;
  }
  const dedupedAtomicMetrics = getAtomicMetricsFromMetricLike(metricLike);
  const sortedAtomicMetrics = [...dedupedAtomicMetrics].sort();
  return `ACEComputed:${sortedAtomicMetrics.join('|')}`;
};
