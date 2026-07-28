import type { NextRouter } from 'next/router';
import type {
  ServerLogDateRangePreset,
  ServerLogDateRangeSelection,
} from '../components/ServerDetailsPage/ServerLogsList/ServerLogsDateRangeControl';
import type { LogSeverityFilterOption } from '../components/ServerDetailsPage/ServerLogsList/ServerLogsList';
import { getQueryString, replaceUrlParams } from './urlParamsShared';

const LOG_MANAGED_KEYS = ['logSearch', 'logSeverity', 'logRange', 'logStart', 'logEnd'] as const;

export interface LogFilterUrlState {
  search: string;
  severityOption: LogSeverityFilterOption;
  dateRangeSelection: ServerLogDateRangeSelection;
}

// 'all' is the implicit default and is represented by omitting the key from the URL.
function parseSeverity(raw: string | undefined): LogSeverityFilterOption | undefined {
  return raw === 'warning' || raw === 'error' ? raw : undefined;
}

function parsePreset(raw: string | undefined): ServerLogDateRangePreset | undefined {
  switch (raw) {
    case 'last1Hour':
    case 'last1Day':
    case 'last7Days':
    case 'custom':
      return raw;
    case undefined:
    default:
      return undefined;
  }
}

function parseDate(raw: string | undefined): Date | undefined {
  if (raw == null) {
    return undefined;
  }
  const ms = Number(raw);
  return Number.isNaN(ms) ? undefined : new Date(ms);
}

export function syncLogFilterStateToUrl(router: NextRouter, state: LogFilterUrlState) {
  const params: Record<string, string> = {};

  if (state.search) {
    params.logSearch = state.search;
  }
  if (state.severityOption !== 'all') {
    params.logSeverity = state.severityOption;
  }

  const { preset, customStart, customEnd } = state.dateRangeSelection;
  if (preset !== 'all') {
    params.logRange = preset;
    if (preset === 'custom') {
      if (customStart) {
        params.logStart = String(customStart.getTime());
      }
      if (customEnd) {
        params.logEnd = String(customEnd.getTime());
      }
    }
  }

  replaceUrlParams(router, params, LOG_MANAGED_KEYS);
}

export function urlParamsToLogFilterState(
  query: Record<string, string | string[] | undefined>,
): Partial<LogFilterUrlState> {
  const result: Partial<LogFilterUrlState> = {};

  const search = getQueryString(query, 'logSearch');
  if (search != null) {
    result.search = search;
  }

  const severityOption = parseSeverity(getQueryString(query, 'logSeverity'));
  if (severityOption != null) {
    result.severityOption = severityOption;
  }

  const preset = parsePreset(getQueryString(query, 'logRange'));
  if (preset != null) {
    result.dateRangeSelection =
      preset === 'custom'
        ? {
            preset,
            customStart: parseDate(getQueryString(query, 'logStart')),
            customEnd: parseDate(getQueryString(query, 'logEnd')),
          }
        : { preset };
  }

  return result;
}
