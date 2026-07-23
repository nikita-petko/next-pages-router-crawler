/**
 * Date Range Utilities
 *
 * Utility functions for calculating date ranges based on RAQIV2DateRangeType.
 * These are shared across the analytics context layer.
 */

import { subDays } from '@rbx/core';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Preset date ranges paired with the approximate lookback window (ms) each
 * covers — i.e. how far before the end date its start sits, mirroring the
 * `subDays` offsets in {@link calculateDatesFromRangeType} (e.g. `Last7Days` =
 * end - 6 days). Ordered smallest → largest. `Custom` has no fixed duration, so
 * it's intentionally omitted.
 *
 * Single source of truth for preset → duration. Use this when you need the
 * presets in order; use {@link PRESET_DATE_RANGE_DURATION_MS} for O(1) lookups.
 */
export const PRESET_DATE_RANGE_DURATIONS_MS = [
  [RAQIV2DateRangeType.Last1Hour, HOUR_MS],
  [RAQIV2DateRangeType.Last1Day, DAY_MS],
  [RAQIV2DateRangeType.Last3Days, 2 * DAY_MS],
  [RAQIV2DateRangeType.Last7Days, 6 * DAY_MS],
  [RAQIV2DateRangeType.Last28Days, 27 * DAY_MS],
  [RAQIV2DateRangeType.Last56Days, 55 * DAY_MS],
  [RAQIV2DateRangeType.Last90Days, 89 * DAY_MS],
  [RAQIV2DateRangeType.Last365Days, 364 * DAY_MS],
] as const satisfies readonly (readonly [RAQIV2DateRangeType, number])[];

/** Lookup form of {@link PRESET_DATE_RANGE_DURATIONS_MS}; `Custom` omitted. */
export const PRESET_DATE_RANGE_DURATION_MS: Partial<Record<RAQIV2DateRangeType, number>> =
  Object.fromEntries(PRESET_DATE_RANGE_DURATIONS_MS);

/**
 * Calculate start and end dates based on range type and custom dates.
 *
 * @param params - Date range calculation inputs.
 * @returns Object with startDate and endDate
 */
type CalculateDatesFromRangeTypeParams = {
  rangeType: RAQIV2DateRangeType;
  customMinTime?: number;
  customMaxTime?: number;
  maxEndDate: Date;
  minStartDate: Date;
  maxRangeDays?: number;
};

export function calculateDatesFromRangeType({
  rangeType,
  customMinTime,
  customMaxTime,
  maxEndDate,
  minStartDate,
  maxRangeDays,
}: CalculateDatesFromRangeTypeParams): { startDate: Date; endDate: Date } {
  const endDate = maxEndDate;

  switch (rangeType) {
    case RAQIV2DateRangeType.Last1Hour: {
      const start = new Date(endDate);
      start.setHours(start.getHours() - 1);
      return { startDate: start, endDate };
    }
    case RAQIV2DateRangeType.Last1Day: {
      const start = subDays(endDate, 1);
      return { startDate: start, endDate };
    }
    case RAQIV2DateRangeType.Last3Days: {
      const start = subDays(endDate, 2);
      return { startDate: start, endDate };
    }
    case RAQIV2DateRangeType.Last7Days: {
      const start = subDays(endDate, 6);
      return { startDate: start, endDate };
    }
    case RAQIV2DateRangeType.Last28Days: {
      const start = subDays(endDate, 27);
      return { startDate: start, endDate };
    }
    case RAQIV2DateRangeType.Last56Days: {
      const start = subDays(endDate, 55);
      return { startDate: start, endDate };
    }
    case RAQIV2DateRangeType.Last90Days: {
      const start = subDays(endDate, 89);
      return { startDate: start, endDate };
    }
    case RAQIV2DateRangeType.Last365Days: {
      const start = subDays(endDate, 364);
      return { startDate: start, endDate };
    }
    case RAQIV2DateRangeType.Custom: {
      let start = customMinTime ? new Date(customMinTime) : subDays(endDate, 27);
      let end = customMaxTime ? new Date(customMaxTime) : endDate;

      // Clamp to bounds
      if (start < minStartDate) {
        start = minStartDate;
      }
      if (end > maxEndDate) {
        end = maxEndDate;
      }

      // Apply max range constraint
      if (maxRangeDays) {
        const maxRange = maxRangeDays * 24 * 60 * 60 * 1000;
        if (end.getTime() - start.getTime() > maxRange) {
          start = new Date(end.getTime() - maxRange);
        }
      }

      // Guard against invalid custom ranges after clamping.
      // This can happen when zoomed bounds are outside latest-available data.
      if (start.getTime() > end.getTime()) {
        start = subDays(maxEndDate, 27);
        if (start < minStartDate) {
          start = minStartDate;
        }
        end = maxEndDate;
        if (start.getTime() > end.getTime()) {
          start = end;
        }
      }

      return { startDate: start, endDate: end };
    }
    default: {
      // Default fallback
      const start = subDays(endDate, 27);
      return { startDate: start, endDate };
    }
  }
}

/**
 * Get a safe default range from supported ranges.
 *
 * @param supportedRanges - Array of supported RAQIV2DateRangeType values
 * @param preferredDefault - The preferred default to use if supported
 * @returns A RAQIV2DateRangeType that is guaranteed to be in supportedRanges, or Last28Days as ultimate fallback
 */
export function getSafeDefaultRange(
  supportedRanges: RAQIV2DateRangeType[] | undefined,
  preferredDefault?: RAQIV2DateRangeType,
): RAQIV2DateRangeType {
  // If no supported ranges, use the preferred default or Last28Days
  if (!supportedRanges || supportedRanges.length === 0) {
    return preferredDefault ?? RAQIV2DateRangeType.Last28Days;
  }

  // If preferred default is in supported ranges, use it
  if (preferredDefault && supportedRanges.includes(preferredDefault)) {
    return preferredDefault;
  }

  // Otherwise use the first supported range
  return supportedRanges[0] ?? RAQIV2DateRangeType.Last28Days;
}
