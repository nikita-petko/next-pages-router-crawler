import type {
  UniverseSessionExitReason,
  UniverseSessionOperatingSystem,
  UniverseSessionPlatform,
} from '@modules/clients/analytics/universeSessionMetadataApi';
import type {
  SessionBrowserDrawerFilters,
  SessionBrowserFilters,
  SessionBrowserNumericRange,
} from '../types/SessionBrowserFilters';
import {
  compactDrawerFilters,
  compactNumericRange,
  pickDrawerFilters,
} from './sessionBrowserFilters';

export enum SessionBrowserFilterChipKey {
  PlaceIds = 'placeIds',
  PlaceVersions = 'placeVersions',
  FunnelTags = 'funnelTags',
  CustomTags = 'customTags',
  HasBugReport = 'hasBugReport',
  Platforms = 'platforms',
  OperatingSystems = 'operatingSystems',
  DeviceRamMegabytes = 'deviceRamMegabytes',
  DurationMinutes = 'durationMinutes',
  MinFps = 'minFps',
  UsedMemoryMegabytes = 'usedMemoryMegabytes',
  ExitReasons = 'exitReasons',
}

export type SessionBrowserFilterChipDescriptor = {
  readonly key: SessionBrowserFilterChipKey;
  readonly label: string;
};

export type SessionBrowserFilterChipLabels = {
  readonly placeLabel: string;
  readonly placeVersionLabel: string;
  readonly funnelEventsLabel: string;
  readonly customEventsLabel: string;
  readonly hasBugReportLabel: string;
  readonly platformLabel: string;
  readonly operatingSystemLabel: string;
  readonly deviceRamLabel: string;
  readonly durationLabel: string;
  readonly minFpsLabel: string;
  readonly usedMemoryLabel: string;
  readonly exitReasonLabel: string;
  readonly formatPlaceIds: (placeIds: readonly string[]) => string;
  readonly formatPlaceVersions: (placeVersions: readonly number[]) => string;
  readonly formatEventTags: (tags: readonly string[]) => string;
  readonly formatPlatforms: (platforms: readonly UniverseSessionPlatform[]) => string;
  readonly formatOperatingSystems: (
    operatingSystems: readonly UniverseSessionOperatingSystem[],
  ) => string;
  readonly formatExitReasons: (exitReasons: readonly UniverseSessionExitReason[]) => string;
};

const GREATER_THAN_OR_EQUAL_SIGN = '\u2265';
const LESS_THAN_OR_EQUAL_SIGN = '\u2264';
const EN_DASH = '\u2013';

const formatListChip = <T>(
  fieldLabel: string,
  values: readonly T[] | undefined,
  formatValues: (values: readonly T[]) => string,
): string | undefined => {
  if (values === undefined || values.length === 0) {
    return undefined;
  }
  return `${fieldLabel}: ${formatValues(values)}`;
};

const formatSessionBrowserNumericRangeChipValue = (range: SessionBrowserNumericRange): string => {
  const hasMin = range.min !== undefined;
  const hasMax = range.max !== undefined;
  if (hasMin && hasMax) {
    return `${range.min} ${EN_DASH} ${range.max}`;
  }
  if (hasMin) {
    return `${GREATER_THAN_OR_EQUAL_SIGN} ${range.min}`;
  }
  return `${LESS_THAN_OR_EQUAL_SIGN} ${range.max}`;
};

const formatRangeChip = (
  fieldLabel: string,
  range: SessionBrowserNumericRange | undefined,
): string | undefined => {
  const compacted = compactNumericRange(range);
  if (compacted === undefined) {
    return undefined;
  }
  return `${fieldLabel}: ${formatSessionBrowserNumericRangeChipValue(compacted)}`;
};

export const getSessionBrowserFilterChipDescriptors = (
  filters: SessionBrowserDrawerFilters,
  labels: SessionBrowserFilterChipLabels,
): readonly SessionBrowserFilterChipDescriptor[] => {
  const chips: SessionBrowserFilterChipDescriptor[] = [];
  const pushChip = (key: SessionBrowserFilterChipKey, label: string | undefined): void => {
    if (label !== undefined) {
      chips.push({ key, label });
    }
  };

  pushChip(
    SessionBrowserFilterChipKey.PlaceIds,
    formatListChip(labels.placeLabel, filters.placeIds, labels.formatPlaceIds),
  );
  pushChip(
    SessionBrowserFilterChipKey.PlaceVersions,
    formatListChip(labels.placeVersionLabel, filters.placeVersions, labels.formatPlaceVersions),
  );
  pushChip(
    SessionBrowserFilterChipKey.FunnelTags,
    formatListChip(labels.funnelEventsLabel, filters.funnelTags, labels.formatEventTags),
  );
  pushChip(
    SessionBrowserFilterChipKey.CustomTags,
    formatListChip(labels.customEventsLabel, filters.customTags, labels.formatEventTags),
  );
  if (filters.hasBugReport === true) {
    chips.push({ key: SessionBrowserFilterChipKey.HasBugReport, label: labels.hasBugReportLabel });
  }
  pushChip(
    SessionBrowserFilterChipKey.Platforms,
    formatListChip(labels.platformLabel, filters.platforms, labels.formatPlatforms),
  );
  pushChip(
    SessionBrowserFilterChipKey.OperatingSystems,
    formatListChip(
      labels.operatingSystemLabel,
      filters.operatingSystems,
      labels.formatOperatingSystems,
    ),
  );
  pushChip(
    SessionBrowserFilterChipKey.DeviceRamMegabytes,
    formatRangeChip(labels.deviceRamLabel, filters.deviceRamMegabytes),
  );
  pushChip(
    SessionBrowserFilterChipKey.DurationMinutes,
    formatRangeChip(labels.durationLabel, filters.durationMinutes),
  );
  pushChip(SessionBrowserFilterChipKey.MinFps, formatRangeChip(labels.minFpsLabel, filters.minFps));
  pushChip(
    SessionBrowserFilterChipKey.UsedMemoryMegabytes,
    formatRangeChip(labels.usedMemoryLabel, filters.usedMemoryMegabytes),
  );
  pushChip(
    SessionBrowserFilterChipKey.ExitReasons,
    formatListChip(labels.exitReasonLabel, filters.exitReasons, labels.formatExitReasons),
  );

  return chips;
};

const omitDrawerField = (
  filters: SessionBrowserDrawerFilters,
  key: SessionBrowserFilterChipKey,
): SessionBrowserDrawerFilters => {
  const { [key]: _removed, ...rest } = filters;
  return rest;
};

export const clearSessionBrowserFilterChip = (
  filters: SessionBrowserFilters,
  chipKey: SessionBrowserFilterChipKey,
): SessionBrowserFilters => {
  let remaining = pickDrawerFilters(filters);
  if (chipKey === SessionBrowserFilterChipKey.PlaceIds) {
    remaining = omitDrawerField(remaining, SessionBrowserFilterChipKey.PlaceIds);
    remaining = omitDrawerField(remaining, SessionBrowserFilterChipKey.PlaceVersions);
  } else {
    remaining = omitDrawerField(remaining, chipKey);
  }

  return {
    dateRange: filters.dateRange,
    ...compactDrawerFilters(remaining),
  };
};
