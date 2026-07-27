/**
 * Millisecond durations shared by the analytics date-range, comparison-window,
 * and rank-window helpers. Kept in one place so the several surfaces that
 * convert between days and milliseconds cannot drift apart.
 */
export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
