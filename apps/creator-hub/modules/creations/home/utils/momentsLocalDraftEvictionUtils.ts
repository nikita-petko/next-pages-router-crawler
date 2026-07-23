import type { StoredMomentCreation } from '../types/StoredMomentCreation';

export type ApplyLocalDraftStoragePolicyResult = {
  moments: StoredMomentCreation[];
  evictedMediaMomentIds: string[];
};

const getModifiedAtTime = (moment: StoredMomentCreation): number =>
  new Date(moment.modifiedAt).getTime();

/** Sorts draft moments oldest-first by `modifiedAt`. */
export const sortDraftsOldestFirst = (
  drafts: readonly StoredMomentCreation[],
): StoredMomentCreation[] =>
  [...drafts].sort((left, right) => getModifiedAtTime(left) - getModifiedAtTime(right));

/** Sorts draft moments newest-first by `modifiedAt`. */
export const sortDraftsNewestFirst = (
  drafts: readonly StoredMomentCreation[],
): StoredMomentCreation[] =>
  [...drafts].sort((left, right) => getModifiedAtTime(right) - getModifiedAtTime(left));

/** Marks draft moments that no longer have local video after media eviction. */
export const markMomentsLocalVideoRemoved = (
  moments: readonly StoredMomentCreation[],
  momentIds: readonly string[],
): StoredMomentCreation[] => {
  if (momentIds.length === 0) {
    return [...moments];
  }

  const idsToUpdate = new Set(momentIds);

  return moments.map((moment) =>
    idsToUpdate.has(moment.id) ? { ...moment, hasLocalVideo: false } : moment,
  );
};

/** Sorts draft moments newest-first. Local video eviction is handled by IndexedDB quota policy. */
export const applyLocalDraftStoragePolicy = (
  drafts: readonly StoredMomentCreation[],
): ApplyLocalDraftStoragePolicyResult => ({
  moments: sortDraftsNewestFirst(drafts),
  evictedMediaMomentIds: [],
});
