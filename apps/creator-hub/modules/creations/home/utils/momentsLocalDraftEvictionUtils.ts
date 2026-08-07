import type { DraftMomentCreation } from '../types/MomentCreation';

export type ApplyLocalDraftStoragePolicyResult = {
  moments: DraftMomentCreation[];
  evictedMediaDraftIds: string[];
};

const getModifiedAtTime = (moment: DraftMomentCreation): number =>
  new Date(moment.modifiedAt).getTime();

/** Sorts draft moments oldest-first by `modifiedAt`. */
export const sortDraftsOldestFirst = (
  drafts: readonly DraftMomentCreation[],
): DraftMomentCreation[] =>
  [...drafts].sort((left, right) => getModifiedAtTime(left) - getModifiedAtTime(right));

/** Sorts draft moments newest-first by `modifiedAt`. */
export const sortDraftsNewestFirst = (
  drafts: readonly DraftMomentCreation[],
): DraftMomentCreation[] =>
  [...drafts].sort((left, right) => getModifiedAtTime(right) - getModifiedAtTime(left));

/** Marks draft moments that no longer have local video after media eviction. */
export const markMomentsLocalVideoRemoved = (
  moments: readonly DraftMomentCreation[],
  draftIds: readonly string[],
): DraftMomentCreation[] => {
  if (draftIds.length === 0) {
    return [...moments];
  }

  const idsToUpdate = new Set(draftIds);

  return moments.map((moment) =>
    idsToUpdate.has(moment.draftId) ? { ...moment, hasLocalVideo: false } : moment,
  );
};

/** Sorts draft moments newest-first. Local video eviction is handled by IndexedDB quota policy. */
export const applyLocalDraftStoragePolicy = (
  drafts: readonly DraftMomentCreation[],
): ApplyLocalDraftStoragePolicyResult => ({
  moments: sortDraftsNewestFirst(drafts),
  evictedMediaDraftIds: [],
});
