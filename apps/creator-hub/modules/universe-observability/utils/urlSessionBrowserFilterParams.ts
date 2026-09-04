import type { NextRouter } from 'next/router';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  UniverseSessionExitReason,
  UniverseSessionOperatingSystem,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import { getQueryForDimension } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { DateRangePreset, type DateRangeSelection } from '../types/Filters';
import {
  DEFAULT_SESSION_BROWSER_FILTERS,
  type SessionBrowserDrawerFilters,
  type SessionBrowserFilters,
  type SessionBrowserNumericRange,
} from '../types/SessionBrowserFilters';
import { compactNumericRange, normalizeNumericRange } from './sessionBrowserFilters';

const RANGE_TYPE_QUERY_KEY = 'rangeType';
const MIN_TIME_QUERY_KEY = 'minTime';
const MAX_TIME_QUERY_KEY = 'maxTime';
const PLACE_QUERY_KEY = getQueryForDimension(RAQIV2Dimension.Place);
const PLACE_VERSION_QUERY_KEY = getQueryForDimension(RAQIV2Dimension.PlaceVersion);
const FUNNEL_NAME_QUERY_KEY = getQueryForDimension(RAQIV2Dimension.FunnelName);
const CUSTOM_EVENT_NAME_QUERY_KEY = getQueryForDimension(RAQIV2Dimension.CustomEventName);
const PLATFORM_QUERY_KEY = getQueryForDimension(RAQIV2Dimension.Platform);
const OPERATING_SYSTEM_QUERY_KEY = getQueryForDimension(RAQIV2Dimension.OperatingSystem);
const HAS_BUG_REPORT_QUERY_KEY = 'filter_HasBugReport';
const DEVICE_RAM_MIN_QUERY_KEY = 'filter_DeviceRamMin';
const DEVICE_RAM_MAX_QUERY_KEY = 'filter_DeviceRamMax';
const DURATION_MIN_QUERY_KEY = 'filter_DurationMin';
const DURATION_MAX_QUERY_KEY = 'filter_DurationMax';
const MIN_FPS_MIN_QUERY_KEY = 'filter_MinFpsMin';
const MIN_FPS_MAX_QUERY_KEY = 'filter_MinFpsMax';
const USED_MEMORY_MIN_QUERY_KEY = 'filter_UsedMemoryMin';
const USED_MEMORY_MAX_QUERY_KEY = 'filter_UsedMemoryMax';
const EXIT_REASON_QUERY_KEY = 'filter_ExitReason';
const HAS_BUG_REPORT_QUERY_VALUE = 'true';

const DATE_QUERY_KEYS = [RANGE_TYPE_QUERY_KEY, MIN_TIME_QUERY_KEY, MAX_TIME_QUERY_KEY] as const;

type QueryRecord = Record<string, string | string[] | undefined>;
type QueryValue = string | string[];

type UrlListField<TValue> = {
  readonly kind: 'list';
  readonly formKey: keyof SessionBrowserDrawerFilters;
  readonly queryKey: string;
  readonly parse: (values: readonly string[]) => readonly TValue[] | undefined;
  readonly requiresPlaceIds?: boolean;
};

type UrlBooleanField = {
  readonly kind: 'boolean';
  readonly formKey: 'hasBugReport';
  readonly queryKey: string;
};

type UrlRangeField = {
  readonly kind: 'range';
  readonly formKey: keyof Pick<
    SessionBrowserDrawerFilters,
    'deviceRamMegabytes' | 'durationMinutes' | 'minFps' | 'usedMemoryMegabytes'
  >;
  readonly minQueryKey: string;
  readonly maxQueryKey: string;
};

type UrlFilterField = UrlListField<string> | UrlListField<number> | UrlBooleanField | UrlRangeField;

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

const parseNonEmptyStrings = (values: readonly string[]): readonly string[] | undefined => {
  const parsed = values.filter((value) => value !== '');
  return parsed.length > 0 ? parsed : undefined;
};

const parseIntegerIdStrings = (values: readonly string[]): readonly string[] | undefined => {
  const parsed = values.filter((value) => Number.isInteger(Number(value)));
  return parsed.length > 0 ? parsed : undefined;
};

const parseIntegerNumbers = (values: readonly string[]): readonly number[] | undefined => {
  const parsed = values.flatMap((value) => {
    const parsedValue = Number(value);
    return Number.isInteger(parsedValue) ? [parsedValue] : [];
  });
  return parsed.length > 0 ? parsed : undefined;
};

const parseEnumList = <TEnum extends string>(
  values: readonly string[],
  enumObject: { readonly [key: string]: TEnum },
): readonly TEnum[] | undefined => {
  const parsed = values.filter((value): value is TEnum => isValidEnumValue(enumObject, value));
  return parsed.length > 0 ? parsed : undefined;
};

const parseFiniteNumber = (value: string | undefined): number | undefined => {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseNumericRangeFromQuery = (
  query: QueryRecord,
  minQueryKey: string,
  maxQueryKey: string,
): SessionBrowserNumericRange | undefined =>
  normalizeNumericRange({
    min: parseFiniteNumber(getQueryString(query, minQueryKey)),
    max: parseFiniteNumber(getQueryString(query, maxQueryKey)),
  });

const SESSION_BROWSER_URL_FILTER_FIELDS: readonly UrlFilterField[] = [
  {
    kind: 'list',
    formKey: 'placeIds',
    queryKey: PLACE_QUERY_KEY,
    parse: parseIntegerIdStrings,
  },
  {
    kind: 'list',
    formKey: 'placeVersions',
    queryKey: PLACE_VERSION_QUERY_KEY,
    parse: parseIntegerNumbers,
    requiresPlaceIds: true,
  },
  {
    kind: 'list',
    formKey: 'funnelTags',
    queryKey: FUNNEL_NAME_QUERY_KEY,
    parse: parseNonEmptyStrings,
  },
  {
    kind: 'list',
    formKey: 'customTags',
    queryKey: CUSTOM_EVENT_NAME_QUERY_KEY,
    parse: parseNonEmptyStrings,
  },
  {
    kind: 'list',
    formKey: 'platforms',
    queryKey: PLATFORM_QUERY_KEY,
    parse: (values) => parseEnumList(values, UniverseSessionPlatform),
  },
  {
    kind: 'list',
    formKey: 'operatingSystems',
    queryKey: OPERATING_SYSTEM_QUERY_KEY,
    parse: (values) => parseEnumList(values, UniverseSessionOperatingSystem),
  },
  {
    kind: 'boolean',
    formKey: 'hasBugReport',
    queryKey: HAS_BUG_REPORT_QUERY_KEY,
  },
  {
    kind: 'range',
    formKey: 'deviceRamMegabytes',
    minQueryKey: DEVICE_RAM_MIN_QUERY_KEY,
    maxQueryKey: DEVICE_RAM_MAX_QUERY_KEY,
  },
  {
    kind: 'range',
    formKey: 'durationMinutes',
    minQueryKey: DURATION_MIN_QUERY_KEY,
    maxQueryKey: DURATION_MAX_QUERY_KEY,
  },
  {
    kind: 'range',
    formKey: 'minFps',
    minQueryKey: MIN_FPS_MIN_QUERY_KEY,
    maxQueryKey: MIN_FPS_MAX_QUERY_KEY,
  },
  {
    kind: 'range',
    formKey: 'usedMemoryMegabytes',
    minQueryKey: USED_MEMORY_MIN_QUERY_KEY,
    maxQueryKey: USED_MEMORY_MAX_QUERY_KEY,
  },
  {
    kind: 'list',
    formKey: 'exitReasons',
    queryKey: EXIT_REASON_QUERY_KEY,
    parse: (values) => parseEnumList(values, UniverseSessionExitReason),
  },
];

const DRAWER_QUERY_KEYS = SESSION_BROWSER_URL_FILTER_FIELDS.flatMap((field) => {
  if (field.kind === 'range') {
    return [field.minQueryKey, field.maxQueryKey];
  }
  return [field.queryKey];
});
const MANAGED_QUERY_KEYS = [...DATE_QUERY_KEYS, ...DRAWER_QUERY_KEYS];

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

const parseListField = (
  field: UrlListField<string> | UrlListField<number>,
  query: QueryRecord,
  hasPlaceIds: boolean,
): Partial<SessionBrowserDrawerFilters> => {
  if (field.requiresPlaceIds && !hasPlaceIds) {
    return {};
  }
  const parsed = field.parse(getQueryStrings(query, field.queryKey));
  return parsed === undefined ? {} : { [field.formKey]: parsed };
};

const parseBooleanField = (
  field: UrlBooleanField,
  query: QueryRecord,
): Partial<SessionBrowserDrawerFilters> => {
  const value = getQueryString(query, field.queryKey);
  return value === HAS_BUG_REPORT_QUERY_VALUE ? { hasBugReport: true } : {};
};

const parseRangeField = (
  field: UrlRangeField,
  query: QueryRecord,
): Partial<SessionBrowserDrawerFilters> => {
  const range = parseNumericRangeFromQuery(query, field.minQueryKey, field.maxQueryKey);
  return range === undefined ? {} : { [field.formKey]: range };
};

const parseField = (
  field: UrlFilterField,
  query: QueryRecord,
  hasPlaceIds: boolean,
): Partial<SessionBrowserDrawerFilters> => {
  if (field.kind === 'list') {
    return parseListField(field, query, hasPlaceIds);
  }
  if (field.kind === 'boolean') {
    return parseBooleanField(field, query);
  }
  return parseRangeField(field, query);
};

const parseDrawerFilters = (query: QueryRecord): SessionBrowserDrawerFilters => {
  const hasPlaceIds = parseIntegerIdStrings(getQueryStrings(query, PLACE_QUERY_KEY)) !== undefined;
  const parsed: SessionBrowserDrawerFilters = {};

  SESSION_BROWSER_URL_FILTER_FIELDS.forEach((field) => {
    Object.assign(parsed, parseField(field, query, hasPlaceIds));
  });

  return parsed;
};

const writeListField = (
  field: UrlListField<string> | UrlListField<number>,
  filters: SessionBrowserDrawerFilters,
  queryParams: Record<string, QueryValue>,
  hasPlaceIds: boolean,
): void => {
  if (field.requiresPlaceIds && !hasPlaceIds) {
    return;
  }
  const value = filters[field.formKey];
  if (!Array.isArray(value) || value.length === 0) {
    return;
  }
  queryParams[field.queryKey] = toQueryValue(value.map(String));
};

const writeBooleanField = (
  field: UrlBooleanField,
  filters: SessionBrowserDrawerFilters,
  queryParams: Record<string, QueryValue>,
): void => {
  if (filters.hasBugReport === true) {
    queryParams[field.queryKey] = HAS_BUG_REPORT_QUERY_VALUE;
  }
};

const writeRangeField = (
  field: UrlRangeField,
  filters: SessionBrowserDrawerFilters,
  queryParams: Record<string, QueryValue>,
): void => {
  const range = compactNumericRange(filters[field.formKey]);
  if (range === undefined) {
    return;
  }
  if (range.min !== undefined) {
    queryParams[field.minQueryKey] = String(range.min);
  }
  if (range.max !== undefined) {
    queryParams[field.maxQueryKey] = String(range.max);
  }
};

const drawerFiltersToQueryParams = (
  filters: SessionBrowserDrawerFilters,
): Record<string, QueryValue> => {
  const queryParams: Record<string, QueryValue> = {};
  const hasPlaceIds = filters.placeIds !== undefined && filters.placeIds.length > 0;

  SESSION_BROWSER_URL_FILTER_FIELDS.forEach((field) => {
    if (field.kind === 'list') {
      writeListField(field, filters, queryParams, hasPlaceIds);
      return;
    }
    if (field.kind === 'boolean') {
      writeBooleanField(field, filters, queryParams);
      return;
    }
    writeRangeField(field, filters, queryParams);
  });

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
