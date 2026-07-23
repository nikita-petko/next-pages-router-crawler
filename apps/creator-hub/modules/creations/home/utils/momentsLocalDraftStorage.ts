import { useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';
import {
  getMomentsLocalStorageKey,
  MOMENTS_LOCAL_STORAGE_INACTIVE_KEY,
  MOMENTS_LOCAL_STORAGE_KEY_PREFIX,
  MOMENTS_LOCAL_STORAGE_VERSION,
  LEGACY_MOMENTS_LOCAL_STORAGE_KEY,
} from '../constants/momentsLocalDraftConstants';
import type { MomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
import type { StoredMomentCreation } from '../types/StoredMomentCreation';
import { getSupersededLocalMomentIds } from './momentsCreationsMergeUtils';
import {
  applyLocalDraftStoragePolicy,
  markMomentsLocalVideoRemoved,
} from './momentsLocalDraftEvictionUtils';
import {
  clearAllMomentVideoMedia,
  clearMomentVideoMediaForUser,
  deleteMomentVideoMedia,
} from './momentsVideoMediaStorage';

export type MomentsLocalStoragePayload = {
  version: string;
  moments: StoredMomentCreation[];
};

export const EMPTY_MOMENTS_LOCAL_STORAGE_PAYLOAD: MomentsLocalStoragePayload = {
  version: MOMENTS_LOCAL_STORAGE_VERSION,
  moments: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMomentsLocalStoragePayload = (value: unknown): value is MomentsLocalStoragePayload =>
  isRecord(value) &&
  value.version === MOMENTS_LOCAL_STORAGE_VERSION &&
  Array.isArray(value.moments);

/** Validates a parsed localStorage payload and returns its moments, or an empty list. */
export const parseMomentsLocalStoragePayload = (value: unknown): StoredMomentCreation[] => {
  if (!isMomentsLocalStoragePayload(value)) {
    return [];
  }

  return value.moments;
};

/** Parses a raw localStorage string into validated moments. */
export const parseMomentsLocalStorageRaw = (raw: string | null): StoredMomentCreation[] => {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return parseMomentsLocalStoragePayload(parsed);
  } catch {
    return [];
  }
};

export const createMomentsLocalStoragePayload = (
  moments: StoredMomentCreation[],
): MomentsLocalStoragePayload => ({
  version: MOMENTS_LOCAL_STORAGE_VERSION,
  moments,
});

export type AddMomentResult = {
  moments: StoredMomentCreation[];
  evictedMediaMomentIds: string[];
};

/** Prepends draft moments and sorts newest-first. */
export const addMomentsToMoments = (
  moments: StoredMomentCreation[],
  newMoments: readonly StoredMomentCreation[],
): AddMomentResult => {
  const existingDrafts = moments.filter(
    (storedMoment) => storedMoment.status === MomentCreationStatus.DRAFT,
  );
  const incomingDrafts = newMoments.map((moment) => ({
    ...moment,
    status: MomentCreationStatus.DRAFT,
    hasLocalVideo: moment.hasLocalVideo ?? true,
  }));

  return applyLocalDraftStoragePolicy([...incomingDrafts, ...existingDrafts]);
};

/** Prepends one draft moment and sorts newest-first. */
export const addMomentToMoments = (
  moments: StoredMomentCreation[],
  moment: StoredMomentCreation,
): AddMomentResult => addMomentsToMoments(moments, [moment]);

export { applyLocalDraftStoragePolicy, markMomentsLocalVideoRemoved };

export const getNonDraftMomentIds = (moments: StoredMomentCreation[]): string[] =>
  moments
    .filter((moment) => moment.status !== MomentCreationStatus.DRAFT)
    .map((moment) => moment.id);

export type MomentMetadataUpdate = Partial<
  Pick<
    StoredMomentCreation,
    'description' | 'status' | 'experienceName' | 'experienceId' | 'rootPlaceId'
  >
>;

/** Removes multiple locally stored Moments by id. */
export const removeMomentsFromMoments = (
  moments: StoredMomentCreation[],
  momentIds: readonly string[],
): StoredMomentCreation[] | null => {
  const idsToRemove = new Set(momentIds);
  if (idsToRemove.size === 0) {
    return null;
  }

  const updatedMoments = moments.filter((moment) => !idsToRemove.has(moment.id));
  if (updatedMoments.length === moments.length) {
    return null;
  }

  return updatedMoments;
};

/** Removes one locally stored Moment by id. */
export const removeMomentFromMoments = (
  moments: StoredMomentCreation[],
  momentId: string,
): StoredMomentCreation[] | null => {
  const index = moments.findIndex((moment) => moment.id === momentId);
  if (index === -1) {
    return null;
  }

  return moments.filter((moment) => moment.id !== momentId);
};

/** Updates metadata for one locally stored Moment and refreshes `modifiedAt`. */
export const updateMomentInMoments = (
  moments: StoredMomentCreation[],
  momentId: string,
  updates: MomentMetadataUpdate,
): StoredMomentCreation[] | null => {
  const index = moments.findIndex((moment) => moment.id === momentId);
  if (index === -1) {
    return null;
  }

  const nextMoments = [...moments];
  nextMoments[index] = {
    ...nextMoments[index],
    ...updates,
    modifiedAt: new Date().toISOString(),
  };

  return nextMoments;
};

const notifyMomentsLocalStorageChanged = (storageKey: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: storageKey,
      newValue: null,
      storageArea: window.localStorage,
    }),
  );
};

const removeAllMomentsLocalStorageKeys = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(LEGACY_MOMENTS_LOCAL_STORAGE_KEY);

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(`${MOMENTS_LOCAL_STORAGE_KEY_PREFIX}.`)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
    notifyMomentsLocalStorageChanged(key);
  }

  notifyMomentsLocalStorageChanged(LEGACY_MOMENTS_LOCAL_STORAGE_KEY);
};

/** Clears browser-persisted Moments drafts and locally stored video media for one user. */
export const clearMomentsLocalDataForUser = async (userId: number): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = getMomentsLocalStorageKey(userId);
  window.localStorage.removeItem(storageKey);
  notifyMomentsLocalStorageChanged(storageKey);
  await clearMomentVideoMediaForUser(userId);
};

/** Clears all legacy and per-user Moments drafts and locally stored video media. */
export const clearAllMomentsLocalData = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  removeAllMomentsLocalStorageKeys();
  await clearAllMomentVideoMedia();
};

export const useMomentsLocalMoments = () => {
  const { user } = useAuthentication();
  const userId = user?.id;
  const isStorageEnabled = userId != null;
  const storageKey = isStorageEnabled
    ? getMomentsLocalStorageKey(userId)
    : MOMENTS_LOCAL_STORAGE_INACTIVE_KEY;

  const [payload, setPayload] = useLocalStorage<MomentsLocalStoragePayload>(
    storageKey,
    EMPTY_MOMENTS_LOCAL_STORAGE_PAYLOAD,
  );

  const moments = useMemo(() => {
    if (!isStorageEnabled) {
      return [];
    }

    return parseMomentsLocalStoragePayload(payload).filter(
      (moment) => moment.status === MomentCreationStatus.DRAFT,
    );
  }, [isStorageEnabled, payload]);

  useEffect(() => {
    if (!isStorageEnabled || userId == null) {
      return;
    }

    const storedMoments = parseMomentsLocalStoragePayload(payload);
    const removedNonDraftMomentIds = getNonDraftMomentIds(storedMoments);

    if (removedNonDraftMomentIds.length === 0) {
      return;
    }

    const draftMoments = storedMoments.filter(
      (moment) => moment.status === MomentCreationStatus.DRAFT,
    );
    setPayload(createMomentsLocalStoragePayload(draftMoments));
    void deleteMomentVideoMedia(userId, removedNonDraftMomentIds);
  }, [isStorageEnabled, payload, setPayload, userId]);

  const addMoments = useCallback(
    (
      newMoments: readonly StoredMomentCreation[],
      options?: { storageEvictedMediaMomentIds?: readonly string[] },
    ): AddMomentResult => {
      if (!isStorageEnabled || userId == null || newMoments.length === 0) {
        return { moments: [], evictedMediaMomentIds: [] };
      }

      const currentMoments = parseMomentsLocalStorageRaw(window.localStorage.getItem(storageKey));
      const { moments: mergedMoments, evictedMediaMomentIds } = addMomentsToMoments(
        currentMoments,
        newMoments,
      );
      const updatedMoments = markMomentsLocalVideoRemoved(
        mergedMoments,
        options?.storageEvictedMediaMomentIds ?? [],
      );
      const allEvictedMediaMomentIds = [
        ...new Set([...(options?.storageEvictedMediaMomentIds ?? []), ...evictedMediaMomentIds]),
      ];

      setPayload(createMomentsLocalStoragePayload(updatedMoments));

      if (allEvictedMediaMomentIds.length > 0) {
        void deleteMomentVideoMedia(userId, allEvictedMediaMomentIds);
      }

      return { moments: updatedMoments, evictedMediaMomentIds: allEvictedMediaMomentIds };
    },
    [isStorageEnabled, setPayload, storageKey, userId],
  );

  const addMoment = useCallback(
    (
      moment: StoredMomentCreation,
      options?: { storageEvictedMediaMomentIds?: readonly string[] },
    ): AddMomentResult => addMoments([moment], options),
    [addMoments],
  );

  const updateMoment = useCallback(
    (momentId: string, updates: MomentMetadataUpdate) => {
      if (!isStorageEnabled || userId == null) {
        return null;
      }

      const updatedMoments = updateMomentInMoments(moments, momentId, updates);
      if (!updatedMoments) {
        return null;
      }

      setPayload(createMomentsLocalStoragePayload(updatedMoments));
      return updatedMoments;
    },
    [isStorageEnabled, moments, setPayload, userId],
  );

  const removeMoment = useCallback(
    (momentId: string) => {
      if (!isStorageEnabled || userId == null) {
        return null;
      }

      const updatedMoments = removeMomentFromMoments(moments, momentId);
      if (!updatedMoments) {
        return null;
      }

      setPayload(createMomentsLocalStoragePayload(updatedMoments));
      void deleteMomentVideoMedia(userId, [momentId]);
      return updatedMoments;
    },
    [isStorageEnabled, moments, setPayload, userId],
  );

  const removeMoments = useCallback(
    (momentIds: readonly string[]) => {
      if (!isStorageEnabled || userId == null) {
        return null;
      }

      const updatedMoments = removeMomentsFromMoments(moments, momentIds);
      if (!updatedMoments) {
        return null;
      }

      const idsToRemove = new Set(momentIds);
      const removedMomentIds = moments
        .filter((moment) => idsToRemove.has(moment.id))
        .map((moment) => moment.id);

      setPayload(createMomentsLocalStoragePayload(updatedMoments));
      void deleteMomentVideoMedia(userId, removedMomentIds);
      return updatedMoments;
    },
    [isStorageEnabled, moments, setPayload, userId],
  );

  const syncWithServerMoments = useCallback(
    (serverMoments: readonly MomentCreation[]) => {
      if (!isStorageEnabled || userId == null) {
        return null;
      }

      const supersededLocalMomentIds = getSupersededLocalMomentIds(serverMoments, moments);
      if (supersededLocalMomentIds.length === 0) {
        return null;
      }

      return removeMoments(supersededLocalMomentIds);
    },
    [isStorageEnabled, moments, removeMoments, userId],
  );

  return {
    moments,
    addMoment,
    addMoments,
    updateMoment,
    removeMoment,
    removeMoments,
    syncWithServerMoments,
  };
};
