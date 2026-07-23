import type { FormattedText } from '@modules/analytics-translations';
import { ChartSummaryType, type ExportMetricLabel } from '@modules/charts-generic';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { RAQIV2Metric, type TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import getAnalyticsMetricDisplayConfig, {
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import { isComputedMetric, type MetricLike } from '../types/ComputedMetric';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isRAQIV2Metric = <TMetric extends TRAQIV2UIMetric>(
  metric: TMetric,
): metric is Extract<TMetric, RAQIV2Metric> => isValidEnumValue(RAQIV2Metric, metric);

/**
 * Returns a human-readable display label for any metric-like value.
 * Always returns FormattedText — atomic metric ids are cast to display strings.
 * Use getExportLabelFromMetricLike when the caller needs to preserve the
 * TRAQIV2UIMetric identity (e.g. for exporter translation lookups).
 */
export const getMetricLabelFromMetricLike = (
  metricLike: MetricLike<TRAQIV2UIMetric>,
): FormattedText => {
  if (!isComputedMetric(metricLike)) {
    return metricLike as FormattedText;
  }
  return (
    isNonEmptyString(metricLike.name) ? metricLike.name : metricLike.formula
  ) as FormattedText;
};

/**
 * Returns a label suitable for chart export file names.
 * Atomic metrics pass through as-is (the exporter translates them);
 * computed metrics resolve to their user-facing name or formula.
 */
export const getExportLabelFromMetricLike = (
  metricLike: MetricLike<TRAQIV2NumericUIMetric>,
): ExportMetricLabel => {
  if (isComputedMetric(metricLike)) {
    return getMetricLabelFromMetricLike(metricLike);
  }
  return metricLike;
};

export const getRAQIV2BenchmarkMetricFromMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): Extract<TMetric, RAQIV2Metric> | null => {
  if (isComputedMetric(metricLike)) {
    return null;
  }

  if (!isRAQIV2Metric(metricLike)) {
    return null;
  }
  return metricLike;
};

export const getDisplayUnitFromMetricLike = (
  metricLike: MetricLike<TRAQIV2NumericUIMetric>,
  { translate }: RAQIV2TranslationDependencies,
): FormattedText => {
  if (isComputedMetric(metricLike)) {
    return '' as FormattedText;
  }
  const { localizedName } = getAnalyticsMetricDisplayConfig(metricLike);
  return translate(localizedName);
};

export const getIsPositiveGoodFromMetricLike = (metric: MetricLike<TRAQIV2UIMetric>): boolean => {
  if (isComputedMetric(metric)) {
    // TODO(gperkins@20260302): derive from equation and source metrics DSA-5477
    return true;
  }
  return getAnalyticsMetricDisplayConfig(metric).isPositiveGood;
};

/**
 * Returns true when the metric's primary aggregation is Average (percentage/rate
 * metrics like retention, CVR). Returns false for Total/summable metrics (DAU,
 * revenue) and for computed metrics (where the aggregation semantics are ambiguous).
 */
export const getIsAverageAggregationMetric = (metric: MetricLike<TRAQIV2UIMetric>): boolean => {
  if (isComputedMetric(metric)) {
    return false;
  }
  const { defaultTotalSummaryTypes } = getAnalyticsMetricDisplayConfig(metric);
  return defaultTotalSummaryTypes?.[0]?.type === ChartSummaryType.Average;
};
