import {
  getComparisonTimeRange,
  type SeriesIntervalMeaning,
  type TExplicitTimeRangeSpec,
} from '@modules/charts-generic';
import { RAQIV2MetricDisplayConfig, type TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { isNumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import { getAtomicMetricsFromMetricLike, type MetricLike } from '../types/ComputedMetric';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Checks whether the comparison time range for a given date range falls within
 * the metric's data retention window. For computed metrics, uses the minimum
 * retention across all source metrics (strictest bound).
 *
 * Returns true (allow comparison) for non-numeric metrics that have no retention config.
 */
const isComparisonWithinRetention = (
  metric: MetricLike<TRAQIV2UIMetric>,
  timeSpec: TExplicitTimeRangeSpec,
  seriesIntervalMeaning: SeriesIntervalMeaning,
): boolean => {
  const atomicMetrics = getAtomicMetricsFromMetricLike(metric);
  const numericMetrics = atomicMetrics.filter(isNumericUIMetric);
  if (numericMetrics.length === 0) {
    return true;
  }

  const { comparisonStartDate } = getComparisonTimeRange(
    timeSpec.startTime,
    timeSpec.endTime,
    seriesIntervalMeaning,
  );

  const minRetentionDays = Math.min(
    ...numericMetrics.map((m) => RAQIV2MetricDisplayConfig[m].retentionDurationDays),
  );

  const retentionCutoff = new Date(Date.now() - minRetentionDays * MS_PER_DAY);
  return comparisonStartDate >= retentionCutoff;
};

export default isComparisonWithinRetention;
