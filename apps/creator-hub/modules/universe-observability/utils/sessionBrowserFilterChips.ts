import type {
  SessionBrowserDrawerFilters,
  SessionBrowserFilters,
} from '../types/SessionBrowserFilters';
import { compactDrawerFilters, pickDrawerFilters } from './sessionBrowserFilters';

export type SessionBrowserFilterChipKey = 'placeIds' | 'placeVersions';

export type SessionBrowserFilterChipDescriptor = {
  readonly key: SessionBrowserFilterChipKey;
  readonly label: string;
};

export type SessionBrowserFilterChipLabels = {
  readonly placeLabel: string;
  readonly placeVersionLabel: string;
  readonly formatPlaceIds: (placeIds: readonly string[]) => string;
  readonly formatPlaceVersions: (placeVersions: readonly number[]) => string;
};

export const getSessionBrowserFilterChipDescriptors = (
  filters: SessionBrowserDrawerFilters,
  labels: SessionBrowserFilterChipLabels,
): readonly SessionBrowserFilterChipDescriptor[] => {
  const chips: SessionBrowserFilterChipDescriptor[] = [];

  if (filters.placeIds !== undefined && filters.placeIds.length > 0) {
    chips.push({
      key: 'placeIds',
      label: `${labels.placeLabel}: ${labels.formatPlaceIds(filters.placeIds)}`,
    });
  }

  if (filters.placeVersions !== undefined && filters.placeVersions.length > 0) {
    chips.push({
      key: 'placeVersions',
      label: `${labels.placeVersionLabel}: ${labels.formatPlaceVersions(filters.placeVersions)}`,
    });
  }

  return chips;
};

export const clearSessionBrowserFilterChip = (
  filters: SessionBrowserFilters,
  chipKey: SessionBrowserFilterChipKey,
): SessionBrowserFilters => {
  switch (chipKey) {
    case 'placeIds': {
      const {
        placeIds: _placeIds,
        placeVersions: _placeVersions,
        ...rest
      } = pickDrawerFilters(filters);
      return {
        dateRange: filters.dateRange,
        ...compactDrawerFilters(rest),
      };
    }
    case 'placeVersions': {
      const { placeVersions: _placeVersions, ...rest } = pickDrawerFilters(filters);
      return {
        dateRange: filters.dateRange,
        ...compactDrawerFilters(rest),
      };
    }
    default: {
      const exhaustiveCheck: never = chipKey;
      throw new Error(`Unhandled session browser filter chip ${String(exhaustiveCheck)}`);
    }
  }
};
