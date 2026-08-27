import { DateRangePreset, type DateRangeSelection, type LogDateRange } from '../types/Filters';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
const DAYS_PER_WEEK = 7;

const getEndOfUtcDay = (date: Date): Date =>
  new Date(
    Math.floor(date.getTime() / MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY +
      MILLISECONDS_PER_DAY -
      1,
  );

export const getDateRangeBounds = (
  dateRangeSelection: DateRangeSelection,
  now: Date = new Date(),
): LogDateRange | undefined => {
  switch (dateRangeSelection.preset) {
    case DateRangePreset.Last1Hour:
      return {
        min: new Date(now.getTime() - MILLISECONDS_PER_HOUR),
        max: now,
      };
    case DateRangePreset.Last1Day:
      return {
        min: new Date(now.getTime() - MILLISECONDS_PER_DAY),
        max: now,
      };
    case DateRangePreset.Last7Days:
      return {
        min: new Date(now.getTime() - DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        max: now,
      };
    case DateRangePreset.Custom:
      return {
        min: dateRangeSelection.customStart,
        max: getEndOfUtcDay(dateRangeSelection.customEnd),
      };
    case DateRangePreset.All:
      return undefined;
    default: {
      const exhaustiveCheck: never = dateRangeSelection;
      return exhaustiveCheck;
    }
  }
};
