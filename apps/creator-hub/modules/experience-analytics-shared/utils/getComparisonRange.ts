import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import { getComparisonTimeRange } from '@modules/charts-generic/utils/comparisonChipUtils';
import { getComparisonWindowGranularity } from '@modules/charts-generic/utils/granularityUtils';
import { COMPARISON_RELATIVE_OFFSET_TO_MS } from '../constants/comparisonOffset';
import type { ComparisonOverlay } from '../types/RAQIV2ChartSpec';

/**
 * The window a comparison range is derived from.
 *
 * Taken whole rather than as loose start/end dates because the previous-period
 * offset depends on `rangeType`, the window bounds, and `snapGranularity`: see
 * {@link getComparisonWindowGranularity}. `rangeType` must be the preset the
 * window was derived from — not `Custom` from snapping explicit bounds.
 */
export type ComparisonRangeTimeSpec = Pick<
  TExplicitTimeRangeSpec,
  'startTime' | 'endTime' | 'rangeType' | 'snapGranularity'
>;

/**
 * Everything {@link getComparisonRange} needs to derive a comparison window.
 *
 * Lives here rather than being picked out of `FetchComparisonOptions` so that
 * every surface computing a comparison range — the retention check, the fetch
 * path, and the ACE rank path — shares one definition without importing the
 * request module (which would be a cycle for callers the request module owns).
 */
export type ComparisonRangeSpec = {
  granularity: RAQIV2MetricGranularity;
  relativeOffset?: ComparisonOverlay['relativeOffset'];
  customStartDate?: ComparisonOverlay['customStartDate'];
};

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
  timeSpec: ComparisonRangeTimeSpec,
  granularity: RAQIV2MetricGranularity,
  relativeOffset?: ComparisonOverlay['relativeOffset'],
  customStartDate?: ComparisonOverlay['customStartDate'],
): { comparisonStartDate: Date; comparisonEndDate: Date } => {
  const { startTime, endTime } = timeSpec;
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
  return getComparisonTimeRange(
    startTime,
    endTime,
    getComparisonWindowGranularity(granularity, timeSpec),
  );
};

export default getComparisonRange;
