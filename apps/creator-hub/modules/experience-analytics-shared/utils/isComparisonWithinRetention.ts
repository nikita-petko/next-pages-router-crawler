import { RAQIV2MetricDisplayConfig, type TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import { isNumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import { DAY_MS } from '../constants/timeConstants';
import { getAtomicMetricsFromMetricLike, type MetricLike } from '../types/ComputedMetric';
import getComparisonRange, { type ComparisonRangeSpec } from './getComparisonRange';

/**
 * Checks whether the comparison time range for a given date range falls within
 * the metric's data retention window. For computed metrics, uses the minimum
 * retention across all source metrics (strictest bound).
 *
 * Routes through `getComparisonRange` so the retention check evaluates the
 * exact same comparison window the fetch path will request — including the
 * relative-offset (`7d`/`14d`/`28d`) and custom-start-date variants. Calling
 * the lower-level `getComparisonTimeRange` here would only cover the legacy
 * previous-period case and silently drift from the requested range near the
 * retention boundary.
 *
 * Returns true (allow comparison) for non-numeric metrics that have no retention config.
 */
const isComparisonWithinRetention = (
  metric: MetricLike<TRAQIV2UIMetric>,
  timeSpec: TExplicitTimeRangeSpec,
  comparison: ComparisonRangeSpec,
): boolean => {
  const atomicMetrics = getAtomicMetricsFromMetricLike(metric);
  const numericMetrics = atomicMetrics.filter(isNumericUIMetric);
  if (numericMetrics.length === 0) {
    return true;
  }

  const { comparisonStartDate } = getComparisonRange(
    timeSpec.startTime,
    timeSpec.endTime,
    comparison.granularity,
    comparison.relativeOffset,
    comparison.customStartDate,
  );

  const minRetentionDays = Math.min(
    ...numericMetrics.map((m) => RAQIV2MetricDisplayConfig[m].retentionDurationDays),
  );

  const retentionCutoff = new Date(Date.now() - minRetentionDays * DAY_MS);
  return comparisonStartDate >= retentionCutoff;
};

export default isComparisonWithinRetention;
