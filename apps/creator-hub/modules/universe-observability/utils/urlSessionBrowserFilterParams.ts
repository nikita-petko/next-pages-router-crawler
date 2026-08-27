import type { NextRouter } from 'next/router';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { DateRangePreset, type DateRangeSelection } from '../types/Filters';
import {
  DEFAULT_SESSION_BROWSER_FILTERS,
  type SessionBrowserFilters,
} from '../types/SessionBrowserFilters';

const RANGE_TYPE_QUERY_KEY = 'rangeType';
const MIN_TIME_QUERY_KEY = 'minTime';
const MAX_TIME_QUERY_KEY = 'maxTime';
const MANAGED_QUERY_KEYS = [RANGE_TYPE_QUERY_KEY, MIN_TIME_QUERY_KEY, MAX_TIME_QUERY_KEY] as const;

const getQueryString = (
  query: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined => {
  const value = query[key];
  return Array.isArray(value) ? value[0] : value;
};

const parsePreset = (value: string | undefined): DateRangePreset | undefined =>
  value !== undefined && isValidEnumValue(DateRangePreset, value) ? value : undefined;

const parseDate = (value: string | undefined): Date | undefined => {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  const milliseconds = Number(value);
  if (!Number.isFinite(milliseconds)) {
    return undefined;
  }
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const urlParamsToSessionBrowserFilters = (
  query: Record<string, string | string[] | undefined>,
): SessionBrowserFilters => {
  const preset = parsePreset(getQueryString(query, RANGE_TYPE_QUERY_KEY));
  if (!preset || preset === DateRangePreset.Last1Day) {
    return DEFAULT_SESSION_BROWSER_FILTERS;
  }
  if (preset !== DateRangePreset.Custom) {
    return { dateRange: { preset } };
  }

  const customStart = parseDate(getQueryString(query, MIN_TIME_QUERY_KEY));
  const customEnd = parseDate(getQueryString(query, MAX_TIME_QUERY_KEY));
  if (!customStart || !customEnd) {
    return DEFAULT_SESSION_BROWSER_FILTERS;
  }
  return {
    dateRange: {
      preset,
      customStart,
      customEnd,
    },
  };
};

const dateRangeToQueryParams = (dateRange: DateRangeSelection): Record<string, string> => {
  if (dateRange.preset === DateRangePreset.Last1Day) {
    return {};
  }
  if (dateRange.preset !== DateRangePreset.Custom) {
    return { [RANGE_TYPE_QUERY_KEY]: dateRange.preset };
  }
  return {
    [RANGE_TYPE_QUERY_KEY]: dateRange.preset,
    [MIN_TIME_QUERY_KEY]: String(dateRange.customStart.getTime()),
    [MAX_TIME_QUERY_KEY]: String(dateRange.customEnd.getTime()),
  };
};

export const syncSessionBrowserFiltersToUrl = (
  router: Pick<NextRouter, 'query' | 'pathname' | 'replace'>,
  filters: SessionBrowserFilters,
): void => {
  const newParams = dateRangeToQueryParams(filters.dateRange);
  const query = { ...router.query };
  let changed = false;

  MANAGED_QUERY_KEYS.forEach((key) => {
    if (key in newParams) {
      if (getQueryString(query, key) !== newParams[key]) {
        query[key] = newParams[key];
        changed = true;
      }
    } else if (key in query) {
      delete query[key];
      changed = true;
    }
  });

  if (changed) {
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }
};
