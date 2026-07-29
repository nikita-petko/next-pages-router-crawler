import type { DateRangeSelection, LogFilter } from '../types/Filters';
import type { LogSeverity } from '../types/LogSeverity';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
const DAYS_PER_WEEK = 7;

const getEndOfUtcDay = (date: Date): Date =>
  new Date(
    Math.floor(date.getTime() / MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY +
      MILLISECONDS_PER_DAY -
      1,
  );

export const getClientLogFilter = (
  dateRangeSelection: DateRangeSelection,
  severity?: LogSeverity,
): LogFilter | undefined => {
  const now = new Date();
  let dateRange: LogFilter['dateRange'];

  switch (dateRangeSelection.preset) {
    case 'last1Hour':
      dateRange = {
        min: new Date(now.getTime() - MILLISECONDS_PER_HOUR),
        max: now,
      };
      break;
    case 'last1Day':
      dateRange = {
        min: new Date(now.getTime() - MILLISECONDS_PER_DAY),
        max: now,
      };
      break;
    case 'last7Days':
      dateRange = {
        min: new Date(now.getTime() - DAYS_PER_WEEK * MILLISECONDS_PER_DAY),
        max: now,
      };
      break;
    case 'custom': {
      const { customStart, customEnd } = dateRangeSelection;
      dateRange = {
        min: customStart,
        max: getEndOfUtcDay(customEnd),
      };
      break;
    }
    case 'all':
    default:
      dateRange = undefined;
  }

  if (!dateRange && severity === undefined) {
    return undefined;
  }

  return {
    ...(dateRange ? { dateRange } : {}),
    ...(severity !== undefined ? { severity } : {}),
  };
};
