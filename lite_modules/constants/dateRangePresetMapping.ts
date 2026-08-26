import { DateRangePreset } from '@rbx/date-range-picker';

import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';

/**
 * Bidirectional mapping between WACAM's backend `DateFilteringTimePeriod`
 * (numeric protobuf enum) and the shared package's `DateRangePreset`
 * (string enum).
 */
const backendToPreset: Record<DateFilteringTimePeriod, DateRangePreset | null> = {
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM]: DateRangePreset.Custom,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_LAST_MONTH]: DateRangePreset.LastMonth,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_PREVIOUS_YEAR]: DateRangePreset.PreviousYear,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS]: DateRangePreset.Last7Days,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS]: DateRangePreset.Last30Days,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIS_MONTH]: DateRangePreset.ThisMonth,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_TODAY]: DateRangePreset.Today,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_UNSPECIFIED]: null,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YEAR_TO_DATE]: DateRangePreset.YearToDate,
  [DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YESTERDAY]: DateRangePreset.Yesterday,
};

const presetToBackend: Partial<Record<DateRangePreset, DateFilteringTimePeriod>> = {
  [DateRangePreset.Custom]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM,
  [DateRangePreset.Last30Days]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS,
  [DateRangePreset.Last7Days]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS,
  [DateRangePreset.LastMonth]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_LAST_MONTH,
  [DateRangePreset.PreviousYear]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_PREVIOUS_YEAR,
  [DateRangePreset.ThisMonth]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIS_MONTH,
  [DateRangePreset.Today]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_TODAY,
  [DateRangePreset.YearToDate]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YEAR_TO_DATE,
  [DateRangePreset.Yesterday]: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_YESTERDAY,
};

export const dateFilteringTimePeriodToPreset = (
  value: DateFilteringTimePeriod,
): DateRangePreset | null => backendToPreset[value] ?? null;

export const dateRangePresetToBackend = (preset: DateRangePreset): DateFilteringTimePeriod | null =>
  presetToBackend[preset] ?? null;

/**
 * Presets that map 1:1 to a backend `DateFilteringTimePeriod` enum. Surfaced
 * as the picker menu when `shouldUseCustomDateRange` is false and used by the
 * URL-sync layer to distinguish backend-enum dispatches from synthetic
 * (client-resolved) presets like `Last{28,56,90}Days`. Slated for removal
 * once the flag reaches 100% and `DATE_RANGE_PRESETS` becomes the sole
 * menu list.
 */
export const LEGACY_DATE_RANGE_PRESETS: DateRangePreset[] = [
  DateRangePreset.Today,
  DateRangePreset.Yesterday,
  DateRangePreset.Last7Days,
  DateRangePreset.Last30Days,
  DateRangePreset.ThisMonth,
  DateRangePreset.LastMonth,
  DateRangePreset.YearToDate,
  DateRangePreset.PreviousYear,
];

// Full preset menu for the custom-range experiment. Contains both a
// carry-over preset (`Last7Days`, which does have a backend enum) and
// synthetic presets (`Last{28,56,90}Days`, which do not) — the latter
// dispatch as CUSTOM with client-resolved bounds. `SyncedDateRangePicker`
// (added in a follow-up PR) renders this list; declared here so the URL
// sync layer's accepted-value set stays in one place.
export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  DateRangePreset.Last7Days,
  DateRangePreset.Last28Days,
  DateRangePreset.Last56Days,
  DateRangePreset.Last90Days,
];

// Treatment-arm default when the URL carries no rangeType. Must be in
// `DATE_RANGE_PRESETS` and resolvable by `resolveLastNDaysInReportingTz`.
export const DATE_RANGE_DEFAULT_PRESET = DateRangePreset.Last28Days;
