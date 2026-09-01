import type { NextRouter } from 'next/router';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { getQueryForDimension } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { DateRangePreset, type DateRangeSelection } from '../types/Filters';
import {
  DEFAULT_SESSION_BROWSER_FILTERS,
  type SessionBrowserDrawerFilters,
  type SessionBrowserFilters,
} from '../types/SessionBrowserFilters';

const RANGE_TYPE_QUERY_KEY = 'rangeType';
const MIN_TIME_QUERY_KEY = 'minTime';
const MAX_TIME_QUERY_KEY = 'maxTime';
const PLACE_QUERY_KEY = getQueryForDimension(RAQIV2Dimension.Place);
const PLACE_VERSION_QUERY_KEY = getQueryForDimension(RAQIV2Dimension.PlaceVersion);

const DATE_QUERY_KEYS = [RANGE_TYPE_QUERY_KEY, MIN_TIME_QUERY_KEY, MAX_TIME_QUERY_KEY] as const;
const DRAWER_QUERY_KEYS = [PLACE_QUERY_KEY, PLACE_VERSION_QUERY_KEY] as const;
const MANAGED_QUERY_KEYS = [...DATE_QUERY_KEYS, ...DRAWER_QUERY_KEYS] as const;

type QueryRecord = Record<string, string | string[] | undefined>;
type QueryValue = string | string[];

const getQueryString = (query: QueryRecord, key: string): string | undefined => {
  const value = query[key];
  return Array.isArray(value) ? value[0] : value;
};

const getQueryStrings = (query: QueryRecord, key: string): string[] => {
  const value = query[key];
  if (value === undefined) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  return values.map((entry) => entry.trim()).filter((entry) => entry !== '');
};

const toQueryValue = (values: readonly string[]): QueryValue =>
  values.length === 1 ? values[0] : [...values];

const toStringList = (value: string | string[] | undefined): string[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const areQueryValuesEqual = (current: string | string[] | undefined, next: QueryValue): boolean => {
  const currentValues = toStringList(current);
  const nextValues = toStringList(next);
  return (
    currentValues.length === nextValues.length &&
    currentValues.every((entry, index) => entry === nextValues[index])
  );
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

const parseDateRange = (query: QueryRecord): DateRangeSelection => {
  const preset = parsePreset(getQueryString(query, RANGE_TYPE_QUERY_KEY));
  if (!preset || preset === DateRangePreset.Last1Day) {
    return DEFAULT_SESSION_BROWSER_FILTERS.dateRange;
  }
  if (preset !== DateRangePreset.Custom) {
    return { preset };
  }

  const customStart = parseDate(getQueryString(query, MIN_TIME_QUERY_KEY));
  const customEnd = parseDate(getQueryString(query, MAX_TIME_QUERY_KEY));
  if (!customStart || !customEnd) {
    return DEFAULT_SESSION_BROWSER_FILTERS.dateRange;
  }
  return {
    preset,
    customStart,
    customEnd,
  };
};

const parsePlaceIds = (query: QueryRecord): readonly string[] | undefined => {
  const placeIds = getQueryStrings(query, PLACE_QUERY_KEY).filter((placeId) =>
    Number.isInteger(Number(placeId)),
  );
  return placeIds.length > 0 ? placeIds : undefined;
};

const parsePlaceVersions = (query: QueryRecord): readonly number[] | undefined => {
  const placeVersions = getQueryStrings(query, PLACE_VERSION_QUERY_KEY).flatMap((value) => {
    const parsedPlaceVersion = Number(value);
    return Number.isInteger(parsedPlaceVersion) ? [parsedPlaceVersion] : [];
  });
  return placeVersions.length > 0 ? placeVersions : undefined;
};

const parseDrawerFilters = (query: QueryRecord): SessionBrowserDrawerFilters => {
  const placeIds = parsePlaceIds(query);
  const placeVersions = placeIds === undefined ? undefined : parsePlaceVersions(query);

  return {
    ...(placeIds === undefined ? {} : { placeIds }),
    ...(placeVersions === undefined ? {} : { placeVersions }),
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

const drawerFiltersToQueryParams = (
  filters: SessionBrowserDrawerFilters,
): Record<string, QueryValue> => {
  const queryParams: Record<string, QueryValue> = {};
  const hasPlaceIds = filters.placeIds !== undefined && filters.placeIds.length > 0;
  if (hasPlaceIds) {
    queryParams[PLACE_QUERY_KEY] = toQueryValue(filters.placeIds);
  }
  if (hasPlaceIds && filters.placeVersions !== undefined && filters.placeVersions.length > 0) {
    queryParams[PLACE_VERSION_QUERY_KEY] = toQueryValue(filters.placeVersions.map(String));
  }
  return queryParams;
};

/** URL query → applied `SessionBrowserFilters`. */
export const urlParamsToSessionBrowserFilters = (query: QueryRecord): SessionBrowserFilters => ({
  dateRange: parseDateRange(query),
  ...parseDrawerFilters(query),
});

/** Applied `SessionBrowserFilters` → URL query (shallow replace). */
export const syncSessionBrowserFiltersToUrl = (
  router: Pick<NextRouter, 'query' | 'pathname' | 'replace'>,
  filters: SessionBrowserFilters,
): void => {
  const newParams: Record<string, QueryValue> = {
    ...dateRangeToQueryParams(filters.dateRange),
    ...drawerFiltersToQueryParams(filters),
  };
  const query = { ...router.query };
  let changed = false;

  MANAGED_QUERY_KEYS.forEach((key) => {
    if (key in newParams) {
      const nextValue = newParams[key];
      if (nextValue !== undefined && !areQueryValuesEqual(query[key], nextValue)) {
        query[key] = nextValue;
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
