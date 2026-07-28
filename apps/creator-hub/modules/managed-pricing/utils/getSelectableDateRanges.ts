import type { DateRange } from '@rbx/client-price-configuration-api/v1';
import type { TDateRange } from '@rbx/foundation-ui';

/**
 * Date math for the reschedule picker. The base window is anchored on the viewer's local "today", and
 * each freeze is greyed on every local calendar day it overlaps — so greyed dates are timezone-local and
 * every selectable day is fully clear of the freeze (which the backend enforces on the absolute instant).
 */

export const MS_PER_MINUTE = 60 * 1000;
export const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

/** Reschedules are allowed up to this many weeks past the anchor date. */
export const MAX_RESCHEDULE_WEEKS = 4;
const DAYS_PER_WEEK = 7;

/** Hard ceiling: never allow a reschedule more than this many days out, regardless of the event window. */
const LAST_POSSIBLE_DATE_OFFSET_DAYS = 180;

/** Returns a new Date offset from `date` by `days` calendar days. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/**
 * The selectable reschedule windows: the base window (`today → min(eventStart + 4 weeks, today + 180
 * days)`, anchored on the viewer's local "today") with the freeze (blackout) dates removed. Returns the
 * allowed sub-windows, or `[]` when every day in the base window is frozen.
 */
export function getSelectableDateRanges(params: {
  eventStartTime: Date | null;
  freezeRanges: readonly DateRange[];
}): TDateRange[] {
  const now = new Date();

  // Hard ceiling: never allow a reschedule more than 180 days out.
  const absoluteMaxDate = addDays(now, LAST_POSSIBLE_DATE_OFFSET_DAYS);

  // 4 weeks past the event start, or 4 weeks from today when the event has
  // already started (active event) or has no start time yet.
  const windowAnchor =
    params.eventStartTime && params.eventStartTime > now ? params.eventStartTime : now;
  const eventWindowMaxDate = addDays(windowAnchor, MAX_RESCHEDULE_WEEKS * DAYS_PER_WEEK);

  const baseWindow: TDateRange = {
    startDate: now,
    // Take the earlier of the two so the absolute cap always wins.
    endDate: absoluteMaxDate < eventWindowMaxDate ? absoluteMaxDate : eventWindowMaxDate,
  };

  return subtractFreezeDates(baseWindow, params.freezeRanges);
}

/** Local-midnight Date for the given calendar day. */
function localMidnight(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day);
}

/** Local midnight at or before `date` — the start of the local calendar day it falls in. */
function floorToLocalDay(date: Date): Date {
  return localMidnight(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Local midnight at or after `date` — the next local midnight, or `date` itself if already midnight. */
function ceilToLocalDay(date: Date): Date {
  const floored = floorToLocalDay(date);
  return floored.getTime() < date.getTime() ? addDays(floored, 1) : floored;
}

/**
 * Removes the freeze dates from `window`, returning the allowed sub-windows (or `[]` if all frozen).
 * Each freeze is greyed on every LOCAL day it overlaps: `from` snaps its start down to local midnight,
 * `until` snaps its end up — so partially-covered boundary days are greyed and selectable days stay clear.
 */
export function subtractFreezeDates(
  window: TDateRange,
  freezeRanges: readonly DateRange[],
): TDateRange[] {
  const windowStart = localMidnight(
    window.startDate.getFullYear(),
    window.startDate.getMonth(),
    window.startDate.getDate(),
  );
  const windowEnd = localMidnight(
    window.endDate.getFullYear(),
    window.endDate.getMonth(),
    window.endDate.getDate(),
  );

  // Each freeze → [first greyed local day, first allowed local day); backend returns them sorted.
  const frozen = freezeRanges.map((range) => ({
    from: floorToLocalDay(range.startDate),
    until: ceilToLocalDay(range.endDate),
  }));

  const allowedRanges: TDateRange[] = [];
  let cursor = windowStart;

  for (const { from, until } of frozen) {
    if (until.getTime() <= cursor.getTime()) {
      continue; // freeze already behind the cursor
    }
    if (from.getTime() >= windowEnd.getTime()) {
      break; // freeze at or past the window end
    }
    if (from.getTime() > cursor.getTime()) {
      allowedRanges.push({ startDate: cursor, endDate: addDays(from, -1) });
    }
    cursor = until;
  }

  if (cursor.getTime() < windowEnd.getTime()) {
    allowedRanges.push({ startDate: cursor, endDate: windowEnd });
  }

  return allowedRanges;
}
