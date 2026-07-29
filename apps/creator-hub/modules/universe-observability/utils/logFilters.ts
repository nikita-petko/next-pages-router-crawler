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

export const getLogFilter = (
  dateRangeSelection: DateRangeSelection,
  severity?: LogSeverity,
  logSearchKey?: string,
): LogFilter | undefined => {
  const now = new Date();
  let dateRange: LogFilter['dateRange'];
  const normalizedLogSearchKey = logSearchKey?.trim();

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

  if (!dateRange && severity === undefined && !normalizedLogSearchKey) {
    return undefined;
  }

  return {
    ...(dateRange ? { dateRange } : {}),
    ...(severity !== undefined ? { severity } : {}),
    ...(normalizedLogSearchKey ? { logSearchKey: normalizedLogSearchKey } : {}),
  };
};

export const clientLogFilterToQuery = (filter: LogFilter | undefined): string | undefined => {
  if (!filter) {
    return undefined;
  }

  const parts: string[] = [];
  if (filter.severity !== undefined) {
    parts.push(`severity in [${filter.severity}]`);
  }
  if (filter.logSearchKey) {
    const escapedSearch = filter.logSearchKey.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
    parts.push(`search == "${escapedSearch}"`);
  }
  if (filter.dateRange?.min) {
    parts.push(`message_timestamp >= "${filter.dateRange.min.toISOString()}"`);
  }
  if (filter.dateRange?.max) {
    parts.push(`message_timestamp <= "${filter.dateRange.max.toISOString()}"`);
  }

  return parts.length > 0 ? parts.join(' && ') : undefined;
};
