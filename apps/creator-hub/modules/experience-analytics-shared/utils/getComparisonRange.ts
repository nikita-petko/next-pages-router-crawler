import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { getComparisonTimeRange } from '@modules/charts-generic/utils/comparisonChipUtils';
import { COMPARISON_RELATIVE_OFFSET_TO_MS } from '../constants/comparisonOffset';
import type { ComparisonOverlay } from '../types/RAQIV2ChartSpec';

/**
 * Returns the [start, end] window for the comparison series.
 *
 * - When `relativeOffset` is set (`'7d' | '14d' | '28d'`), shifts the main
 *   window backwards by that fixed amount. The fetch layer and chart adapter
 *   must both use this helper so the requested range and the rendered range
 *   stay in sync.
 * - When `customStartDate` is set, anchors the comparison window to that
 *   start date while preserving the main window duration.
 * - When `relativeOffset` is undefined, falls back to the legacy
 *   "previous period" behavior (window immediately preceding the main one).
 */
const getComparisonRange = (
  startTime: Date,
  endTime: Date,
  granularity: RAQIV2MetricGranularity,
  relativeOffset?: ComparisonOverlay['relativeOffset'],
  customStartDate?: ComparisonOverlay['customStartDate'],
): { comparisonStartDate: Date; comparisonEndDate: Date } => {
  if (customStartDate) {
    const durationMs = endTime.getTime() - startTime.getTime();
    return {
      comparisonStartDate: customStartDate,
      comparisonEndDate: new Date(customStartDate.getTime() + durationMs),
    };
  }
  if (relativeOffset) {
    const offsetMs = COMPARISON_RELATIVE_OFFSET_TO_MS[relativeOffset];
    return {
      comparisonStartDate: new Date(startTime.getTime() - offsetMs),
      comparisonEndDate: new Date(endTime.getTime() - offsetMs),
    };
  }
  return getComparisonTimeRange(startTime, endTime, granularity);
};

export default getComparisonRange;
