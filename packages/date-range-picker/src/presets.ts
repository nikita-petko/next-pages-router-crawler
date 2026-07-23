import { DateRangePreset } from './DateRangePreset';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Subtract `days` calendar days from `date` in the local timezone.
 *
 * Uses `setDate`, which walks calendar days in local time. Across a DST
 * transition the resulting instant may be shifted by an hour relative to
 * a naive `date.getTime() - days * 86400000` calculation, which is the
 * desired behavior for a picker that thinks in local calendar days.
 */
const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

/**
 * Start of a "Last N Days" window, inclusive of `now`'s calendar day.
 * `Last7Days` from Sunday = Monday-of-last-week to Sunday (7 calendar days).
 */
const startOfLastNDays = (now: Date, n: number): Date => subDays(now, n - 1);

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Whether the preset's computed range fits inside `[minStartDate, maxEndDate]`.
 * End-side is intentionally not checked because calendar-anchored presets
 * (Today, ThisMonth, ...) extend through end-of-day and can trivially overshoot
 * a midnight-aligned `maxEndDate` without being meaningfully out of bounds.
 */
export const isRangeWithinBounds = (
  preset: DateRangePreset,
  minStartDate: Date,
  maxEndDate: Date,
): boolean => {
  if (preset === DateRangePreset.Custom) {
    return true;
  }
  const range = computeRangeForPreset(preset, maxEndDate);
  return range === null || range.startDate.getTime() >= minStartDate.getTime();
};

export type ComputedDateRange = { startDate: Date; endDate: Date };

/**
 * Compute {startDate, endDate} for a preset given "now" as the reference point.
 * `Custom` returns `null` because callers must supply their own dates.
 */
export const computeRangeForPreset = (
  preset: DateRangePreset,
  now: Date = new Date(),
): ComputedDateRange | null => {
  switch (preset) {
    case DateRangePreset.Custom:
      return null;
    case DateRangePreset.Last1Hour: {
      const startDate = new Date(now.getTime() - 60 * 60 * 1000);
      return { startDate, endDate: now };
    }
    case DateRangePreset.Last1Day:
      return { startDate: subDays(now, 1), endDate: now };
    case DateRangePreset.Last3Days:
      return { startDate: startOfLastNDays(now, 3), endDate: now };
    case DateRangePreset.Last7Days:
      return { startDate: startOfLastNDays(now, 7), endDate: now };
    case DateRangePreset.Last28Days:
      return { startDate: startOfLastNDays(now, 28), endDate: now };
    case DateRangePreset.Last30Days:
      return { startDate: startOfLastNDays(now, 30), endDate: now };
    case DateRangePreset.Last56Days:
      return { startDate: startOfLastNDays(now, 56), endDate: now };
    case DateRangePreset.Last90Days:
      return { startDate: startOfLastNDays(now, 90), endDate: now };
    case DateRangePreset.Last365Days:
      return { startDate: startOfLastNDays(now, 365), endDate: now };
    case DateRangePreset.Today:
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case DateRangePreset.Yesterday: {
      const y = subDays(now, 1);
      return { startDate: startOfDay(y), endDate: endOfDay(y) };
    }
    case DateRangePreset.ThisMonth: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
    case DateRangePreset.LastMonth: {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    case DateRangePreset.YearToDate: {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }
    case DateRangePreset.PreviousYear: {
      const start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }
    default: {
      const exhaustiveCheck: never = preset;
      throw new Error(`Unhandled DateRangePreset: ${String(exhaustiveCheck)}`);
    }
  }
};

/**
 * Given a start date and a max range in days, compute the tightest end date.
 * Used by the custom-range picker to constrain how far the user can drag the
 * end date away from the start date.
 */
export const clampEndDateToMaxRange = (
  startDate: Date,
  maxEndDate: Date,
  maxRangeDays?: number,
): Date => {
  if (!maxRangeDays) {
    return maxEndDate;
  }
  const maxRangeEnd = new Date(startDate.getTime() + (maxRangeDays - 1) * MS_PER_DAY);
  return maxRangeEnd < maxEndDate ? maxRangeEnd : maxEndDate;
};
