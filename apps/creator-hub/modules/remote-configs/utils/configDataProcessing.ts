import { SortKey, SortOrder, EntryTypeFilter } from '../api/universeConfigsClientEnums';
import type {
  ValidConfigEntryDetail,
  ValidConfigEntryInfo,
  ValidGetLatestConfigurationResponse,
} from '../api/validTypes';
import {
  configEntryToKey,
  configEntryToLastAccessedTimeAsString,
  configEntryToDescription,
} from './configEntryAccessors';

/**
 * Transform ConfigEntryInfo[] from the new API to ValidConfigEntryDetail[] for the frontend
 */
export const transformConfigEntryInfoToDetail = (
  configEntryInfo: ValidConfigEntryInfo,
): ValidConfigEntryDetail => {
  return {
    isOverride: true,
    overrideEntry: {
      entry: configEntryInfo.entry,
      lastModifiedTime: configEntryInfo.lastModifiedTime,
    },
    lastAccessedTime: configEntryInfo.lastAccessedTime,
  };
};

/**
 * Transform GetLatestConfigurationResponse to the format expected by the frontend
 */
export const transformLatestConfigurationResponse = (
  response: ValidGetLatestConfigurationResponse,
): { entries: ValidConfigEntryDetail[]; total: number; configVersion: number } => {
  const entries = response.entries?.map(transformConfigEntryInfoToDetail) || [];
  return {
    entries,
    total: entries.length,
    configVersion: response.configVersion,
  };
};

/**
 * Filter and sort config entries (moved from MockCreatorConfigsApi)
 */
export const filterAndSortConfigEntries = (
  entries: ValidConfigEntryDetail[],
  options: {
    searchKey?: string;
    sortOrder?: SortOrder;
    sortKey?: SortKey;
    typeFilter?: EntryTypeFilter;
  } = {},
): ValidConfigEntryDetail[] => {
  const { searchKey, sortOrder: sortOrderGiven, sortKey: sortKeyGiven, typeFilter } = options;
  let filtered = entries;

  const getKey = configEntryToKey;
  const getLastModifiedTime = (detail: ValidConfigEntryDetail) => {
    if (!detail.isOverride) {
      return null;
    }
    if (!detail.overrideEntry?.lastModifiedTime) {
      return null;
    }
    return new Date(detail.overrideEntry.lastModifiedTime).getTime();
  };
  const getLastAccessedTime = (detail: ValidConfigEntryDetail) => {
    const result = configEntryToLastAccessedTimeAsString(detail);
    if (!result) {
      return null;
    }
    return new Date(result).getTime();
  };

  // Apply type filter
  if (typeFilter === EntryTypeFilter.Override) {
    filtered = filtered.filter((detail) => detail.isOverride);
  }

  // Apply search filter
  if (searchKey) {
    const searchKeyLower = searchKey.toLowerCase();
    filtered = filtered.filter((detail) => {
      const key = configEntryToKey(detail);
      const description = configEntryToDescription(detail);

      const keyMatches = key?.toLowerCase().includes(searchKeyLower) || false;
      const descriptionMatches = description?.toLowerCase().includes(searchKeyLower) || false;

      return keyMatches || descriptionMatches;
    });
  }

  // Apply sorting
  const sortKey = sortKeyGiven || SortKey.LastModifiedTime;
  const sortOrder = sortOrderGiven || SortOrder.Ascending;
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case SortKey.ConfigEntryKey: {
        const aKey = getKey(a);
        const bKey = getKey(b);
        comparison = aKey.localeCompare(bKey);
        break;
      }
      case SortKey.LastModifiedTime: {
        const aModTime = getLastModifiedTime(a);
        const bModTime = getLastModifiedTime(b);
        if (aModTime === null) {
          return 1;
        }
        if (bModTime === null) {
          return -1;
        }
        comparison = aModTime - bModTime;
        break;
      }
      case SortKey.LastAccessedTime: {
        const aAccessTime = getLastAccessedTime(a);
        const bAccessTime = getLastAccessedTime(b);
        if (aAccessTime === null) {
          return 1;
        }
        if (bAccessTime === null) {
          return -1;
        }
        comparison = aAccessTime - bAccessTime;
        break;
      }
      default: {
        const exhaustiveCheck: never = sortKey;
        throw new Error(`Unhandled sort key: ${exhaustiveCheck}`);
      }
    }
    return sortOrder === SortOrder.Descending ? -comparison : comparison;
  });

  return filtered;
};

/**
 * Paginate entries
 */
export const paginateEntries = <T>(entries: T[], maxPageSize?: number, skip?: number): T[] => {
  if (!maxPageSize || maxPageSize <= 0) {
    return entries;
  }
  const start = skip || 0;
  const end = start + maxPageSize;
  return entries.slice(start, end);
};

/**
 * Check if a response represents "no change" based on configVersion and entries
 */
export const isNoChangeResponse = (
  response: ValidGetLatestConfigurationResponse,
  cachedVersion: number | undefined,
): boolean => {
  return (
    response.configVersion === cachedVersion && (!response.entries || response.entries.length === 0)
  );
};
