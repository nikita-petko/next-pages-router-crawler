export enum VirtualDateRangePreset {
  Last7Days = 'last7Days',
  Last30Days = 'last30Days',
  Last90Days = 'last90Days',
}

export const DEFAULT_VIRTUAL_DATE_RANGE = VirtualDateRangePreset.Last30Days;

// Earliest date selectable in the calendar (mirrors the Creator Store tab). Built from LOCAL
// calendar fields, not a UTC instant: the picker compares against local calendar dates, and a
// UTC midnight (`2024-04-01T00:00:00Z`) reads as March 31 in timezones west of UTC.
// Note: the Date month arg is 0-indexed, so `3` is April — this is April 1, 2024.
export const VIRTUAL_MIN_DATE = new Date(2024, 3, 1);

// Number of days each rolling preset spans, inclusive of today.
export const DAYS_BY_PRESET: Record<VirtualDateRangePreset, number> = {
  [VirtualDateRangePreset.Last7Days]: 7,
  [VirtualDateRangePreset.Last30Days]: 30,
  [VirtualDateRangePreset.Last90Days]: 90,
};

export type VirtualDateRangeMillis = { startTimeMillis: number; endTimeMillis: number };

// Local start-of-day of the first date in an N-day window ending on (and including) `from`. A
// 7-day window ending today therefore starts 6 days earlier so it spans 7 calendar dates, not 8.
// Uses calendar arithmetic (not fixed 24h math) so it stays correct across DST transitions.
export const startOfLocalDaysAgo = (from: Date, days: number): Date =>
  new Date(from.getFullYear(), from.getMonth(), from.getDate() - (days - 1));

// Resolves a calendar-picked start/end pair into an inclusive window: from the start of the start
// day to the end of the end day, so transactions on both boundary days are included. The backend
// query is [start, end) (start-inclusive, end-exclusive), so end-of-day covers the whole end day.
export const getCustomRangeMillis = (start: Date, end: Date): VirtualDateRangeMillis => ({
  startTimeMillis: new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime(),
  endTimeMillis: new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    23,
    59,
    59,
    999,
  ).getTime(),
});

// Resolves a rolling preset into an inclusive epoch-millis window ending at `now`. `now` is passed
// in (rather than read here) so the window stays stable across renders and is testable.
export const getDateRangeMillis = (
  preset: VirtualDateRangePreset,
  now: number,
): VirtualDateRangeMillis => {
  const end = new Date(now);
  return getCustomRangeMillis(startOfLocalDaysAgo(end, DAYS_BY_PRESET[preset]), end);
};
