import type { PlaySessionQueryOptions } from '@modules/clients/analytics/universeSessionMetadataApi';
import {
  DEFAULT_SESSION_BROWSER_DRAWER_FILTERS,
  type SessionBrowserDrawerFilters,
  type SessionBrowserFilters,
  type SessionBrowserNumericRange,
} from '../types/SessionBrowserFilters';
import { MILLISECONDS_PER_MINUTE } from './clientSessionFormatters';
import { getDateRangeBounds } from './filterUtils';

const pickFields = <T extends Record<string, unknown>>(
  fields: T,
  shouldKeep: (value: T[keyof T]) => boolean,
): Partial<T> => {
  const picked: Partial<T> = {};
  Object.keys(fields).forEach((key) => {
    const fieldKey = key as keyof T;
    const value = fields[fieldKey];
    if (shouldKeep(value)) {
      picked[fieldKey] = value;
    }
  });
  return picked;
};

const omitUndefinedFields = <T extends Record<string, unknown>>(fields: T): Partial<T> =>
  pickFields(fields, (value) => value !== undefined);

const omitEmptyFields = <T extends Record<string, unknown>>(fields: T): Partial<T> =>
  pickFields(
    fields,
    (value) => value !== undefined && !(Array.isArray(value) && value.length === 0),
  );

const toNonEmptyArray = <T>(values: readonly T[] | undefined): T[] | undefined =>
  values !== undefined && values.length > 0 ? [...values] : undefined;

const toPlaceIds = (placeIds: readonly string[] | undefined): number[] | undefined => {
  if (placeIds === undefined || placeIds.length === 0) {
    return undefined;
  }

  const parsedPlaceIds = placeIds.flatMap((placeId) => {
    const trimmedPlaceId = placeId.trim();
    if (trimmedPlaceId === '') {
      return [];
    }

    const parsedPlaceId = Number(trimmedPlaceId);
    return Number.isInteger(parsedPlaceId) ? [parsedPlaceId] : [];
  });

  return parsedPlaceIds.length > 0 ? parsedPlaceIds : undefined;
};

const toQueryNumericRange = (
  range: SessionBrowserNumericRange | undefined,
  transform: (value: number) => number = (value) => value,
): SessionBrowserNumericRange | undefined => {
  if (range === undefined) {
    return undefined;
  }

  const mappedRange = omitUndefinedFields({
    min: range.min !== undefined && Number.isFinite(range.min) ? transform(range.min) : undefined,
    max: range.max !== undefined && Number.isFinite(range.max) ? transform(range.max) : undefined,
  });

  return mappedRange.min === undefined && mappedRange.max === undefined ? undefined : mappedRange;
};

/** Applied `SessionBrowserFilters` → drawer form values (drops page `dateRange`). */
export const pickDrawerFilters = ({
  dateRange: _dateRange,
  ...drawerFilters
}: SessionBrowserFilters): SessionBrowserDrawerFilters => drawerFilters;

/** Names every field because RHF treats `reset({})` as restoring prior defaults. */
export const toDrawerFormValues = (
  filters: SessionBrowserFilters,
): SessionBrowserDrawerFilters => ({
  ...DEFAULT_SESSION_BROWSER_DRAWER_FILTERS,
  ...pickDrawerFilters(filters),
});

/** Drops undefined values and empty multi-select arrays from applied state. */
export const compactDrawerFilters = (
  drawerFilters: SessionBrowserDrawerFilters,
): SessionBrowserDrawerFilters => omitEmptyFields(drawerFilters);

/** Maps applied `SessionBrowserFilters` onto the play-session query body (`PlaySessionQueryOptions`). */
export const toPlaySessionQueryOptions = (
  filters: SessionBrowserFilters,
): PlaySessionQueryOptions => {
  const dateRange = getDateRangeBounds(filters.dateRange);
  const placeIds = toPlaceIds(filters.placeIds);

  // Date objects are absolute instants. The generated metadata client serializes
  // these bounds as UTC for the play-session query endpoint.
  return omitUndefinedFields({
    startTime: dateRange?.min,
    endTime: dateRange?.max,
    placeIds,
    placeVersions: placeIds === undefined ? undefined : toNonEmptyArray(filters.placeVersions),
    funnelTags: toNonEmptyArray(filters.funnelTags),
    customTags: toNonEmptyArray(filters.customTags),
    hasBugReport: filters.hasBugReport === true ? true : undefined,
    platforms: toNonEmptyArray(filters.platforms),
    operatingSystems: toNonEmptyArray(filters.operatingSystems),
    exitReasons: toNonEmptyArray(filters.exitReasons),
    clientDeviceRamMegabytes: toQueryNumericRange(filters.deviceRamMegabytes),
    durationMilliseconds: toQueryNumericRange(
      filters.durationMinutes,
      (minutes) => minutes * MILLISECONDS_PER_MINUTE,
    ),
    minFps: toQueryNumericRange(filters.minFps),
    clientUsedMemoryMegabytes: toQueryNumericRange(filters.usedMemoryMegabytes),
  });
};
