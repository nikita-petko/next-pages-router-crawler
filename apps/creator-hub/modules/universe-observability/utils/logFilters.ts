import type { DateRangeSelection, LogFilter } from '../types/Filters';
import type { LogSeverity } from '../types/LogSeverity';
import { getDateRangeBounds } from './filterUtils';

export const getLogFilter = (
  dateRangeSelection: DateRangeSelection,
  severity?: LogSeverity,
  logSearchKey?: string,
): LogFilter | undefined => {
  const dateRange = getDateRangeBounds(dateRangeSelection);
  const normalizedLogSearchKey = logSearchKey?.trim();

  if (!dateRange && severity === undefined && !normalizedLogSearchKey) {
    return undefined;
  }

  return {
    ...(dateRange ? { dateRange } : {}),
    ...(severity !== undefined ? { severities: [severity] } : {}),
    ...(normalizedLogSearchKey ? { logSearchKey: normalizedLogSearchKey } : {}),
  };
};

export const clientLogFilterToQuery = (filter: LogFilter | undefined): string | undefined => {
  if (!filter) {
    return undefined;
  }

  const parts: string[] = [];
  if (filter.severities?.length) {
    parts.push(`severity in [${filter.severities.join(',')}]`);
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
