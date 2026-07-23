import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { isComparisonCompatibleDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';

/** Chart types that can render a period-over-period comparison series. */
export const COMPARISON_SUPPORTED_CHART_TYPES: ReadonlySet<ChartType> = new Set([
  ChartType.Spline,
  ChartType.DurationSpline,
]);

/** Chart types whose breakdown always includes a duration bucket dimension. */
export const DURATION_CHART_TYPES: ReadonlySet<ChartType> = new Set([
  ChartType.DurationSpline,
  ChartType.DurationArea,
]);

/**
 * Whether the period-over-period comparison line is meaningful for a chart with
 * the given type and breakdown — and therefore shown by default when the chart
 * specifies no explicit overlays.
 *
 * Single source of truth shared by `useResolvedOverlays` (the default applied on
 * dashboards) and `getOverlayAvailability` (the explore-mode toggle's
 * enabled/disabled state), so the two can never drift.
 *
 * The line is meaningful when:
 * - the chart type can render a comparison series (Spline, DurationSpline), and
 * - either there is no breakdown, or — for duration charts — the breakdown is
 *   solely comparison-compatible duration buckets (e.g. SessionTimeBucket).
 */
const isComparisonOverlayMeaningful = ({
  chartType,
  breakdown,
}: {
  chartType?: ChartType;
  breakdown?: readonly TRAQIV2Dimension[];
}): boolean => {
  if (chartType !== undefined && !COMPARISON_SUPPORTED_CHART_TYPES.has(chartType)) {
    return false;
  }
  if (!breakdown?.length) {
    return true;
  }
  const isDurationChartType = chartType !== undefined && DURATION_CHART_TYPES.has(chartType);
  return isDurationChartType && breakdown.every(isComparisonCompatibleDurationBucketDimension);
};

export default isComparisonOverlayMeaningful;
