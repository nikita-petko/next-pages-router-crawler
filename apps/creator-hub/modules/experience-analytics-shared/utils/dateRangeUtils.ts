/**
 * Date Range Utilities
 *
 * Utility functions for calculating date ranges based on DateRangeType.
 * These are shared across the analytics context layer.
 */

import { subDays } from '@rbx/core';
import { DateRangeType } from '@modules/charts-generic';

/**
 * Calculate start and end dates based on range type and custom dates.
 *
 * @param rangeType - The type of date range (Last7Days, Last28Days, Custom, etc.)
 * @param customMinTime - Custom min time in milliseconds (used when rangeType is Custom)
 * @param customMaxTime - Custom max time in milliseconds (used when rangeType is Custom)
 * @param maxEndDate - The maximum allowed end date
 * @param minStartDate - The minimum allowed start date
 * @param maxRangeDays - Optional maximum range in days (for Custom range)
 * @returns Object with startDate and endDate
 */
export function calculateDatesFromRangeType(
  rangeType: DateRangeType,
  customMinTime: number | undefined,
  customMaxTime: number | undefined,
  maxEndDate: Date,
  minStartDate: Date,
  maxRangeDays?: number,
): { startDate: Date; endDate: Date } {
  const endDate = maxEndDate;

  switch (rangeType) {
    case DateRangeType.Last1Hour: {
      const start = new Date(endDate);
      start.setHours(start.getHours() - 1);
      return { startDate: start, endDate };
    }
    case DateRangeType.Last1Day: {
      const start = subDays(endDate, 1);
      return { startDate: start, endDate };
    }
    case DateRangeType.Last3Days: {
      const start = subDays(endDate, 3);
      return { startDate: start, endDate };
    }
    case DateRangeType.Last7Days: {
      const start = subDays(endDate, 7);
      return { startDate: start, endDate };
    }
    case DateRangeType.Last28Days: {
      const start = subDays(endDate, 28);
      return { startDate: start, endDate };
    }
    case DateRangeType.Last56Days: {
      const start = subDays(endDate, 56);
      return { startDate: start, endDate };
    }
    case DateRangeType.Last90Days: {
      const start = subDays(endDate, 90);
      return { startDate: start, endDate };
    }
    case DateRangeType.Last365Days: {
      const start = subDays(endDate, 365);
      return { startDate: start, endDate };
    }
    case DateRangeType.Custom: {
      let start = customMinTime ? new Date(customMinTime) : subDays(endDate, 28);
      let end = customMaxTime ? new Date(customMaxTime) : endDate;

      // Clamp to bounds
      if (start < minStartDate) start = minStartDate;
      if (end > maxEndDate) end = maxEndDate;

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
        start = subDays(maxEndDate, 28);
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
      const start = subDays(endDate, 28);
      return { startDate: start, endDate };
    }
  }
}

/**
 * Get a safe default range from supported ranges.
 *
 * @param supportedRanges - Array of supported DateRangeType values
 * @param preferredDefault - The preferred default to use if supported
 * @returns A DateRangeType that is guaranteed to be in supportedRanges, or Last28Days as ultimate fallback
 */
export function getSafeDefaultRange(
  supportedRanges: DateRangeType[] | undefined,
  preferredDefault?: DateRangeType,
): DateRangeType {
  // If no supported ranges, use the preferred default or Last28Days
  if (!supportedRanges || supportedRanges.length === 0) {
    return preferredDefault ?? DateRangeType.Last28Days;
  }

  // If preferred default is in supported ranges, use it
  if (preferredDefault && supportedRanges.includes(preferredDefault)) {
    return preferredDefault;
  }

  // Otherwise use the first supported range
  return supportedRanges[0] ?? DateRangeType.Last28Days;
}
