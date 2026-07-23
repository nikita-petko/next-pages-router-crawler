import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ComparisonRangePolicy } from '../types/ComparisonConfig';

const DAY_MS = 24 * 60 * 60 * 1000;
export const LONG_RANGE_COMPARISON_MINIMUM_DAYS = 180;

const getUTCDayTimestamp = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const isComparisonRangeAllowed = (
  timeSpec: TExplicitTimeRangeSpec,
  rangePolicy: ComparisonRangePolicy,
): boolean => {
  if (rangePolicy === 'allRanges') {
    return true;
  }

  // Analytics date ranges include both endpoint days. Comparing raw timestamps
  // would therefore treat a displayed 180-day range as only 179 days.
  const endpointSpanMs = Math.abs(
    getUTCDayTimestamp(timeSpec.endTime) - getUTCDayTimestamp(timeSpec.startTime),
  );
  const inclusiveRangeDays = endpointSpanMs / DAY_MS + 1;
  return inclusiveRangeDays < LONG_RANGE_COMPARISON_MINIMUM_DAYS;
};

export default isComparisonRangeAllowed;
