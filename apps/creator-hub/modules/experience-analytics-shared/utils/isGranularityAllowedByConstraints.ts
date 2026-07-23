import { subDays } from '@rbx/core';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { GranularityConstraintRule } from '../types/RAQIV2PageConfig';
import type { TUIGranularity } from './seriesGranularities';
import { snapToLatestStartTime } from './snapToLatestTimestep';

/**
 * Evaluate the page-config `granularity.constraints` rule list for a single
 * granularity against the current date range. Callers (notably
 * `getPageGranularityOptions`) interpret the result with per-granularity
 * replacement semantics: a granularity listed in `constraints` is governed
 * entirely by this function (the matrix is bypassed), while a granularity
 * not listed falls through to the matrix.
 *
 *  - If the granularity is not present in `constraints` (or `constraints` is
 *    undefined), no gating applies — the function returns `true` and the
 *    matrix decision stands at the callsite.
 *  - If the granularity maps to an empty rule list, it is always denied (the
 *    replacement for the legacy `GranularityConstraint.NOT_ALLOWED`).
 *  - Otherwise the granularity is allowed iff at least one rule's matchers
 *    apply to the current request (OR across the rule list).
 *
 * Uses `endDate` (not the current wall-clock time) as the reference for
 * freshness so pages using `EndDateBehavior.LatestAvailableForMetrics` don't
 * incorrectly hide granularities due to data lag.
 */
const isGranularityAllowedByConstraints = ({
  constraints,
  granularity,
  startDate,
  endDate,
}: {
  constraints?: Partial<Record<TUIGranularity, GranularityConstraintRule[]>>;
  granularity: TUIGranularity;
  startDate: Date;
  endDate: Date;
}): boolean => {
  const rules = constraints?.[granularity];
  if (rules == null) {
    return true;
  }
  if (rules.length === 0) {
    return false;
  }

  const durationMs = Math.abs(endDate.getTime() - startDate.getTime());

  return rules.some((rule) => {
    if (rule.type === 'freshness') {
      // Match the legacy MOST_RECENT_SEVEN_DAYS boundary: subDays(endDate, 8)
      // snapped to day. `startWithinDays + 1` preserves the inclusive 7-full-day
      // window relative to the snap-to-day boundary.
      const boundary = snapToLatestStartTime(
        subDays(endDate, rule.startWithinDays + 1),
        RAQIV2MetricGranularity.OneDay,
      );
      return startDate >= boundary;
    }
    return (
      (rule.minDurationMs == null || durationMs >= rule.minDurationMs) &&
      (rule.maxDurationMs == null || durationMs <= rule.maxDurationMs)
    );
  });
};

export default isGranularityAllowedByConstraints;
