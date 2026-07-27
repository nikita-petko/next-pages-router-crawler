import { DateRangePreset } from '@rbx/date-range-picker';

import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';

/**
 * Bidirectional mapping between WACAM's backend `DateFilteringTimePeriod`
 * (numeric protobuf enum) and the shared package's `DateRangePreset`
 * (string enum). Kept co-located with `DATE_FILTERING_TIME_PERIOD_OPTIONS`
 * so future preset additions land in both places.
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

export const WACAM_DATE_RANGE_PRESETS: DateRangePreset[] = [
  DateRangePreset.Today,
  DateRangePreset.Yesterday,
  DateRangePreset.Last7Days,
  DateRangePreset.Last30Days,
  DateRangePreset.ThisMonth,
  DateRangePreset.LastMonth,
  DateRangePreset.YearToDate,
  DateRangePreset.PreviousYear,
];
