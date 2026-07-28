import type { CreatorConfigsPublicApiConfigValueFull } from '@modules/clients/creatorConfigsPublicApi';
import type { LastUpdatedCacheEntry } from './lastUpdatedCache';

export type SortColumn = 'name' | 'locationId' | 'lastUpdated';
export type SortDirection = 'asc' | 'desc';
export type SortState = { column: SortColumn | null; direction: SortDirection };

export type DisplayEntry = { key: string; value: CreatorConfigsPublicApiConfigValueFull };

export type DisplayRow = {
  rowKey: string;
  key: string;
  locationId: string;
  value: CreatorConfigsPublicApiConfigValueFull;
};

const getUpdatedEpoch = (
  key: string,
  value: CreatorConfigsPublicApiConfigValueFull,
  lastUpdatedByKey: Record<string, LastUpdatedCacheEntry>,
): number => {
  const iso = lastUpdatedByKey[key]?.updatedAtIso ?? value.lastModifiedTime;
  const epoch = new Date(iso).getTime();
  return Number.isFinite(epoch) ? epoch : 0;
};

const buildRowsForConfig = (
  key: string,
  value: CreatorConfigsPublicApiConfigValueFull,
  locationsByConfigName: Map<string, Set<string>>,
): DisplayRow[] => {
  const locations = locationsByConfigName.get(key);
  if (!locations || locations.size === 0) {
    return [{ rowKey: `${key}::`, key, locationId: '', value }];
  }
  return Array.from(locations)
    .sort((a, b) => a.localeCompare(b))
    .map((locationId) => ({ rowKey: `${key}::${locationId}`, key, locationId, value }));
};

export const buildDisplayRows = ({
  displayEntries,
  locationsByConfigName,
  sortState,
  lastUpdatedByKey,
}: {
  displayEntries: DisplayEntry[];
  locationsByConfigName: Map<string, Set<string>>;
  sortState: SortState;
  lastUpdatedByKey: Record<string, LastUpdatedCacheEntry>;
}): DisplayRow[] => {
  const baseRows = displayEntries.flatMap(({ key, value }) =>
    buildRowsForConfig(key, value, locationsByConfigName),
  );

  if (sortState.column == null) {
    return baseRows;
  }

  if (sortState.column === 'locationId') {
    const dir = sortState.direction === 'asc' ? 1 : -1;
    return [...baseRows].sort((a, b) => {
      const aLoc = a.locationId;
      const bLoc = b.locationId;
      // Empty locationId sorts last in asc, first in desc.
      if (aLoc === '' && bLoc !== '') {
        return 1 * dir;
      }
      if (aLoc !== '' && bLoc === '') {
        return -1 * dir;
      }
      const locCmp = aLoc.localeCompare(bLoc);
      if (locCmp !== 0) {
        return locCmp * dir;
      }
      const keyCmp = a.key.localeCompare(b.key);
      if (keyCmp !== 0) {
        return keyCmp * dir;
      }
      return a.rowKey.localeCompare(b.rowKey);
    });
  }

  const sortedConfigs = [...displayEntries].sort((a, b) => {
    if (sortState.column === 'name') {
      const cmp = a.key.localeCompare(b.key);
      return sortState.direction === 'asc' ? cmp : -cmp;
    }
    const aEpoch = getUpdatedEpoch(a.key, a.value, lastUpdatedByKey);
    const bEpoch = getUpdatedEpoch(b.key, b.value, lastUpdatedByKey);
    const cmp = aEpoch - bEpoch;
    if (cmp !== 0) {
      return sortState.direction === 'asc' ? cmp : -cmp;
    }
    // Stable tiebreaker
    return a.key.localeCompare(b.key);
  });

  return sortedConfigs.flatMap(({ key, value }) =>
    buildRowsForConfig(key, value, locationsByConfigName),
  );
};
