import { useCallback, useEffect, useMemo } from 'react';
import { Locale } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { useAuthentication } from '@modules/authentication/providers';
import {
  getMomentsLocalStorageKey,
  MOMENTS_LOCAL_STORAGE_INACTIVE_KEY,
  MOMENTS_LOCAL_STORAGE_KEY_PREFIX,
  MOMENTS_LOCAL_STORAGE_VERSION,
  LEGACY_MOMENTS_LOCAL_STORAGE_KEY,
} from '../constants/momentsLocalDraftConstants';
import type { DraftMomentCreation } from '../types/MomentCreation';
import { MomentCreationStatus } from '../types/MomentCreation';
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
  moments: DraftMomentCreation[];
};

export const EMPTY_MOMENTS_LOCAL_STORAGE_PAYLOAD: MomentsLocalStoragePayload = {
  version: MOMENTS_LOCAL_STORAGE_VERSION,
  moments: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isVersionedPayload = (
  value: unknown,
): value is { version: string; moments: readonly unknown[] } =>
  isRecord(value) &&
  value.version === MOMENTS_LOCAL_STORAGE_VERSION &&
  Array.isArray(value.moments);

/**
 * Returns the stored records without validating them.
 *
 * Callers that need typed drafts should use `parseMomentsLocalStoragePayload`. This exists for the
 * non-draft purge, which has to see records the normalizer rejects in order to clean them up.
 */
export const readRawMomentsLocalStorageRecords = (value: unknown): readonly unknown[] =>
  isVersionedPayload(value) ? value.moments : [];

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const asOptionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const LOCALE_VALUES = new Set<string>(Object.values(Locale));

const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && LOCALE_VALUES.has(value);

const asOptionalLocale = (value: unknown): Locale | undefined =>
  isLocale(value) ? value : undefined;

/**
 * Validates one stored record, tolerating the pre-`draftId` shape.
 *
 * Records written before the feed-id migration stored the local UUID as `id`, so `draftId ?? id`
 * keeps them readable — and because the value is inherited verbatim, each draft's IndexedDB video
 * blob (keyed by that same UUID) stays reachable.
 *
 * Only `draftId` and a `draft` status are required. Secondary fields fall back to defaults rather
 * than rejecting the record, because losing a creator's draft is worse than rendering it with an
 * empty experience name; a draft that lost its `experienceId` still recovers through the edit
 * drawer's experience picker. Non-draft records are rejected so they cannot violate the union's
 * `status` discriminant, and the purge effect deletes them from storage.
 */
const normalizeStoredDraft = (value: unknown): DraftMomentCreation | null => {
  if (!isRecord(value)) {
    return null;
  }

  const draftId = asOptionalString(value.draftId) ?? asOptionalString(value.id);
  if (draftId == null || draftId === '') {
    return null;
  }

  if (value.status !== MomentCreationStatus.DRAFT) {
    return null;
  }

  return {
    draftId,
    status: MomentCreationStatus.DRAFT,
    experienceId: asOptionalNumber(value.experienceId) ?? 0,
    rootPlaceId: asOptionalNumber(value.rootPlaceId),
    experienceName: asOptionalString(value.experienceName) ?? '',
    description: asOptionalString(value.description) ?? '',
    modifiedAt: asOptionalString(value.modifiedAt) ?? new Date(0).toISOString(),
    assetId: asOptionalNumber(value.assetId),
    thumbnailUrl: asOptionalString(value.thumbnailUrl),
    videoUrl: asOptionalString(value.videoUrl),
    universeId: asOptionalNumber(value.universeId),
    locale: asOptionalLocale(value.locale),
    ...(typeof value.hasLocalVideo === 'boolean' ? { hasLocalVideo: value.hasLocalVideo } : {}),
  };
};

/**
 * Validates a parsed localStorage payload and returns its drafts.
 *
 * Normalizes per record, so one corrupt entry no longer discards the whole list.
 */
export const parseMomentsLocalStoragePayload = (value: unknown): DraftMomentCreation[] =>
  readRawMomentsLocalStorageRecords(value)
    .map((record) => normalizeStoredDraft(record))
    .filter((moment): moment is DraftMomentCreation => moment != null);

/** Parses a raw localStorage string into validated drafts. */
export const parseMomentsLocalStorageRaw = (raw: string | null): DraftMomentCreation[] => {
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
  moments: DraftMomentCreation[],
): MomentsLocalStoragePayload => ({
  version: MOMENTS_LOCAL_STORAGE_VERSION,
  moments,
});

export type AddMomentResult = {
  moments: DraftMomentCreation[];
  evictedMediaDraftIds: string[];
};

/** Prepends draft moments and sorts newest-first. */
export const addMomentsToMoments = (
  moments: DraftMomentCreation[],
  newMoments: readonly DraftMomentCreation[],
): AddMomentResult => {
  // Forcing `status` on write is what lets `status` discriminate the `MomentCreation` union:
  // a record in local storage can only ever be a draft.
  const incomingDrafts = newMoments.map((moment) => ({
    ...moment,
    status: MomentCreationStatus.DRAFT,
    hasLocalVideo: moment.hasLocalVideo ?? true,
  }));

  return applyLocalDraftStoragePolicy([...incomingDrafts, ...moments]);
};

/** Prepends one draft moment and sorts newest-first. */
export const addMomentToMoments = (
  moments: DraftMomentCreation[],
  moment: DraftMomentCreation,
): AddMomentResult => addMomentsToMoments(moments, [moment]);

export { applyLocalDraftStoragePolicy, markMomentsLocalVideoRemoved };

/**
 * Returns the ids of stored records that are not drafts, reading raw records so it can still see
 * legacy non-draft entries that `normalizeStoredDraft` filters out.
 */
export const getNonDraftStoredIds = (records: readonly unknown[]): string[] =>
  records
    .filter((record) => isRecord(record) && record.status !== MomentCreationStatus.DRAFT)
    .map((record) =>
      isRecord(record)
        ? (asOptionalString(record.draftId) ?? asOptionalString(record.id) ?? '')
        : '',
    )
    .filter((draftId) => draftId !== '');

/**
 * `status` is deliberately absent: mutating it would produce a structurally invalid record under the
 * union, and no call site ever passed it.
 */
export type MomentMetadataUpdate = Partial<
  Pick<
    DraftMomentCreation,
    'description' | 'experienceName' | 'experienceId' | 'rootPlaceId' | 'locale'
  >
>;

/** Removes multiple locally stored drafts by draft id. */
export const removeMomentsFromMoments = (
  moments: DraftMomentCreation[],
  draftIds: readonly string[],
): DraftMomentCreation[] | null => {
  const idsToRemove = new Set(draftIds);
  if (idsToRemove.size === 0) {
    return null;
  }

  const updatedMoments = moments.filter((moment) => !idsToRemove.has(moment.draftId));
  if (updatedMoments.length === moments.length) {
    return null;
  }

  return updatedMoments;
};

/** Removes one locally stored draft by draft id. */
export const removeMomentFromMoments = (
  moments: DraftMomentCreation[],
  draftId: string,
): DraftMomentCreation[] | null => {
  const index = moments.findIndex((moment) => moment.draftId === draftId);
  if (index === -1) {
    return null;
  }

  return moments.filter((moment) => moment.draftId !== draftId);
};

/** Updates metadata for one locally stored draft and refreshes `modifiedAt`. */
export const updateMomentInMoments = (
  moments: DraftMomentCreation[],
  draftId: string,
  updates: MomentMetadataUpdate,
): DraftMomentCreation[] | null => {
  const index = moments.findIndex((moment) => moment.draftId === draftId);
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

    return parseMomentsLocalStoragePayload(payload);
  }, [isStorageEnabled, payload]);

  useEffect(() => {
    if (!isStorageEnabled || userId == null) {
      return;
    }

    const removedNonDraftIds = getNonDraftStoredIds(readRawMomentsLocalStorageRecords(payload));
    if (removedNonDraftIds.length === 0) {
      return;
    }

    setPayload(createMomentsLocalStoragePayload(moments));
    void deleteMomentVideoMedia(userId, removedNonDraftIds);
  }, [isStorageEnabled, moments, payload, setPayload, userId]);

  const addMoments = useCallback(
    (
      newMoments: readonly DraftMomentCreation[],
      options?: { storageEvictedMediaDraftIds?: readonly string[] },
    ): AddMomentResult => {
      if (!isStorageEnabled || userId == null || newMoments.length === 0) {
        return { moments: [], evictedMediaDraftIds: [] };
      }

      const currentMoments = parseMomentsLocalStorageRaw(window.localStorage.getItem(storageKey));
      const { moments: mergedMoments, evictedMediaDraftIds } = addMomentsToMoments(
        currentMoments,
        newMoments,
      );
      const updatedMoments = markMomentsLocalVideoRemoved(
        mergedMoments,
        options?.storageEvictedMediaDraftIds ?? [],
      );
      const allEvictedMediaDraftIds = [
        ...new Set([...(options?.storageEvictedMediaDraftIds ?? []), ...evictedMediaDraftIds]),
      ];

      setPayload(createMomentsLocalStoragePayload(updatedMoments));

      if (allEvictedMediaDraftIds.length > 0) {
        void deleteMomentVideoMedia(userId, allEvictedMediaDraftIds);
      }

      return { moments: updatedMoments, evictedMediaDraftIds: allEvictedMediaDraftIds };
    },
    [isStorageEnabled, setPayload, storageKey, userId],
  );

  const addMoment = useCallback(
    (
      moment: DraftMomentCreation,
      options?: { storageEvictedMediaDraftIds?: readonly string[] },
    ): AddMomentResult => addMoments([moment], options),
    [addMoments],
  );

  const updateMoment = useCallback(
    (draftId: string, updates: MomentMetadataUpdate) => {
      if (!isStorageEnabled || userId == null) {
        return null;
      }

      const updatedMoments = updateMomentInMoments(moments, draftId, updates);
      if (!updatedMoments) {
        return null;
      }

      setPayload(createMomentsLocalStoragePayload(updatedMoments));
      return updatedMoments;
    },
    [isStorageEnabled, moments, setPayload, userId],
  );

  const removeMoment = useCallback(
    (draftId: string) => {
      if (!isStorageEnabled || userId == null) {
        return null;
      }

      const updatedMoments = removeMomentFromMoments(moments, draftId);
      if (!updatedMoments) {
        return null;
      }

      setPayload(createMomentsLocalStoragePayload(updatedMoments));
      void deleteMomentVideoMedia(userId, [draftId]);
      return updatedMoments;
    },
    [isStorageEnabled, moments, setPayload, userId],
  );

  const removeMoments = useCallback(
    (draftIds: readonly string[]) => {
      if (!isStorageEnabled || userId == null) {
        return null;
      }

      const updatedMoments = removeMomentsFromMoments(moments, draftIds);
      if (!updatedMoments) {
        return null;
      }

      const idsToRemove = new Set(draftIds);
      const removedDraftIds = moments
        .filter((moment) => idsToRemove.has(moment.draftId))
        .map((moment) => moment.draftId);

      setPayload(createMomentsLocalStoragePayload(updatedMoments));
      void deleteMomentVideoMedia(userId, removedDraftIds);
      return updatedMoments;
    },
    [isStorageEnabled, moments, setPayload, userId],
  );

  return {
    moments,
    addMoment,
    addMoments,
    updateMoment,
    removeMoment,
    removeMoments,
  };
};
