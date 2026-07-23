/**
 * Covers day-count, calendar-anchored, and hour presets plus Custom.
 * Callers select the subset they want via `DateRangeControl`'s
 * `dateRangeOptions` prop. String-valued so it's stable across consumers and
 * easy to serialize.
 */
export enum DateRangePreset {
  Last1Hour = 'Last1Hour',
  Last1Day = 'Last1Day',
  Last3Days = 'Last3Days',
  Last7Days = 'Last7Days',
  Last28Days = 'Last28Days',
  Last30Days = 'Last30Days',
  Last56Days = 'Last56Days',
  Last90Days = 'Last90Days',
  Last365Days = 'Last365Days',
  Today = 'Today',
  Yesterday = 'Yesterday',
  ThisMonth = 'ThisMonth',
  LastMonth = 'LastMonth',
  YearToDate = 'YearToDate',
  PreviousYear = 'PreviousYear',
  Custom = 'Custom',
}

const dateRangePresetValues = new Set<unknown>(Object.values(DateRangePreset));

export const isDateRangePreset = (value: unknown): value is DateRangePreset => {
  return dateRangePresetValues.has(value);
};
