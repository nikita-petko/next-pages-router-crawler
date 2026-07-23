import {
  getMomentsVideoMediaDbName,
  LEGACY_MOMENTS_VIDEO_MEDIA_DB_NAME,
  MOMENTS_VIDEO_MEDIA_DB_NAME_PREFIX,
  MOMENTS_VIDEO_MEDIA_DB_VERSION,
  MOMENTS_VIDEO_MEDIA_STORE_NAME,
} from '../constants/momentsVideoMediaConstants';
import type { StoredMomentCreation } from '../types/StoredMomentCreation';
import { sortDraftsOldestFirst } from './momentsLocalDraftEvictionUtils';
import { generateVideoThumbnailBlob } from './momentsVideoPreviewUtils';

/**
 * IndexedDB unavailability (SSR, blocked API, private mode, open/quota errors):
 *
 * - `openDatabase` / reads / writes / deletes reject; callers must handle failures.
 *   `useMomentVideoMedia` catches load errors and shows an empty thumbnail (no crash).
 *   Upload fails if `saveMomentVideoMedia` cannot persist after eviction retries
 *   (dialog resets the file selection).
 * - `clearMomentVideoMediaForUser` / `clearAllMomentVideoMedia` are best-effort: they no-op when
 *   `indexedDB` is undefined and swallow open/clear errors so logout/cleanup never throws.
 * - Draft metadata in localStorage is unaffected; only local video/thumbnail blobs are missing.
 */

export type MomentVideoMediaRecord = {
  momentId: string;
  videoBlob: Blob;
  thumbnailBlob: Blob;
  fileName?: string;
  updatedAt: string;
};

export type MomentVideoMediaUrls = {
  thumbnailUrl: string;
  videoUrl: string;
};

const mediaUrlCache = new Map<string, MomentVideoMediaUrls>();

const getMediaCacheKey = (userId: number, momentId: string): string => `${userId}:${momentId}`;

const openDatabase = (userId: number): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    const request = indexedDB.open(
      getMomentsVideoMediaDbName(userId),
      MOMENTS_VIDEO_MEDIA_DB_VERSION,
    );

    request.addEventListener('upgradeneeded', () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(MOMENTS_VIDEO_MEDIA_STORE_NAME)) {
        database.createObjectStore(MOMENTS_VIDEO_MEDIA_STORE_NAME, { keyPath: 'momentId' });
      }
    });

    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () =>
      reject(request.error ?? new Error('Failed to open IndexedDB')),
    );
  });

const runTransaction = (
  userId: number,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest,
): Promise<unknown> =>
  openDatabase(userId).then(
    (database) =>
      new Promise<unknown>((resolve, reject) => {
        const transaction = database.transaction(MOMENTS_VIDEO_MEDIA_STORE_NAME, mode);
        const store = transaction.objectStore(MOMENTS_VIDEO_MEDIA_STORE_NAME);
        const request = operation(store);

        request.addEventListener('success', () => resolve(request.result));
        request.addEventListener('error', () =>
          reject(request.error ?? new Error('IndexedDB request failed')),
        );
      }),
  );

const isMomentVideoMediaRecord = (value: unknown): value is MomentVideoMediaRecord => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'momentId' in value &&
    typeof value.momentId === 'string' &&
    'videoBlob' in value &&
    value.videoBlob instanceof Blob &&
    'thumbnailBlob' in value &&
    value.thumbnailBlob instanceof Blob &&
    'updatedAt' in value &&
    typeof value.updatedAt === 'string'
  );
};

const getDefaultMomentVideoFileName = (videoBlob: Blob): string =>
  videoBlob.type.includes('quicktime') ? 'moment.mov' : 'moment.mp4';

const getMomentVideoFileName = (record: MomentVideoMediaRecord): string => {
  const storedFileName = record.fileName?.trim();
  if (storedFileName) {
    return storedFileName;
  }

  return getDefaultMomentVideoFileName(record.videoBlob);
};

const revokeCachedMediaUrls = (userId: number, momentId: string): void => {
  const cacheKey = getMediaCacheKey(userId, momentId);
  const cachedUrls = mediaUrlCache.get(cacheKey);
  if (!cachedUrls) {
    return;
  }

  URL.revokeObjectURL(cachedUrls.thumbnailUrl);
  URL.revokeObjectURL(cachedUrls.videoUrl);
  mediaUrlCache.delete(cacheKey);
};

/** Persists a Moment video file and generated thumbnail frame in IndexedDB. */
export const saveMomentVideoMedia = async (
  userId: number,
  momentId: string,
  file: File,
): Promise<void> => {
  const thumbnailBlob = await generateVideoThumbnailBlob(file);
  const record: MomentVideoMediaRecord = {
    momentId,
    videoBlob: file,
    thumbnailBlob,
    fileName: file.name,
    updatedAt: new Date().toISOString(),
  };

  revokeCachedMediaUrls(userId, momentId);
  await runTransaction(userId, 'readwrite', (store) => store.put(record));
};

const QUOTA_EXCEEDED_ERROR_NAMES = new Set(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED']);

/** Returns whether an error indicates browser storage quota was exceeded. */
export const isQuotaExceededError = (error: unknown): boolean => {
  if (error instanceof DOMException && QUOTA_EXCEEDED_ERROR_NAMES.has(error.name)) {
    return true;
  }

  return error instanceof Error && error.message.toLowerCase().includes('quota');
};

export type SaveMomentVideoMediaWithEvictionResult = {
  evictedMediaMomentIds: string[];
};

/**
 * Persists moment video media, evicting oldest local draft videos when storage quota is exceeded.
 * Draft metadata remains in localStorage; evicted drafts should be marked `hasLocalVideo: false`.
 */
export const saveMomentVideoMediaWithEviction = async (
  userId: number,
  momentId: string,
  file: File,
  draftMoments: readonly StoredMomentCreation[],
): Promise<SaveMomentVideoMediaWithEvictionResult> => {
  const evictedMediaMomentIds: string[] = [];

  const trySave = async (): Promise<void> => {
    await saveMomentVideoMedia(userId, momentId, file);
  };

  try {
    await trySave();
    return { evictedMediaMomentIds };
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error;
    }
  }

  const evictionCandidates = sortDraftsOldestFirst(
    draftMoments.filter((moment) => moment.id !== momentId && moment.hasLocalVideo !== false),
  );

  for (const candidate of evictionCandidates) {
    await deleteMomentVideoMedia(userId, [candidate.id]);
    if (!evictedMediaMomentIds.includes(candidate.id)) {
      evictedMediaMomentIds.push(candidate.id);
    }

    try {
      await trySave();
      return { evictedMediaMomentIds };
    } catch (error) {
      if (!isQuotaExceededError(error)) {
        throw error;
      }
    }
  }

  throw new Error('Failed to store moment video locally');
};

/** Loads the locally stored video file for a Moment. */
export async function getMomentVideoFile(userId: number, momentId: string): Promise<File | null> {
  const result = await runTransaction(userId, 'readonly', (store) => store.get(momentId));

  if (!isMomentVideoMediaRecord(result)) {
    return null;
  }

  const { videoBlob } = result;

  return new File([videoBlob], getMomentVideoFileName(result), {
    type: videoBlob.type || 'video/mp4',
  });
}

/** Loads object URLs for a locally stored Moment video + thumbnail. */
export const getMomentVideoMediaUrls = async (
  userId: number,
  momentId: string,
): Promise<MomentVideoMediaUrls | null> => {
  const cacheKey = getMediaCacheKey(userId, momentId);
  const cachedUrls = mediaUrlCache.get(cacheKey);
  if (cachedUrls) {
    return cachedUrls;
  }

  const result = await runTransaction(userId, 'readonly', (store) => store.get(momentId));

  if (!isMomentVideoMediaRecord(result)) {
    return null;
  }

  const urls: MomentVideoMediaUrls = {
    thumbnailUrl: URL.createObjectURL(result.thumbnailBlob),
    videoUrl: URL.createObjectURL(result.videoBlob),
  };
  mediaUrlCache.set(cacheKey, urls);
  return urls;
};

/** Deletes locally stored media for one or more Moments. */
export const deleteMomentVideoMedia = async (
  userId: number,
  momentIds: string[],
): Promise<void> => {
  if (momentIds.length === 0) {
    return;
  }

  await Promise.all(
    momentIds.map(async (momentId) => {
      revokeCachedMediaUrls(userId, momentId);
      await runTransaction(userId, 'readwrite', (store) => store.delete(momentId));
    }),
  );
};

/** Revokes all cached blob URLs. IndexedDB media is unchanged — URLs are recreated on next load. */
export const clearMomentVideoMediaUrlCache = (): void => {
  for (const cacheKey of mediaUrlCache.keys()) {
    const cachedUrls = mediaUrlCache.get(cacheKey);
    if (!cachedUrls) {
      continue;
    }

    URL.revokeObjectURL(cachedUrls.thumbnailUrl);
    URL.revokeObjectURL(cachedUrls.videoUrl);
    mediaUrlCache.delete(cacheKey);
  }
};

const clearMomentVideoMediaDatabase = async (dbName: string): Promise<void> => {
  clearMomentVideoMediaUrlCache();

  if (typeof indexedDB === 'undefined') {
    return;
  }

  try {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, MOMENTS_VIDEO_MEDIA_DB_VERSION);

      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () =>
        reject(request.error ?? new Error('Failed to open IndexedDB')),
      );
    });

    await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(MOMENTS_VIDEO_MEDIA_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(MOMENTS_VIDEO_MEDIA_STORE_NAME);
      const request = store.clear();

      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () =>
        reject(request.error ?? new Error('IndexedDB request failed')),
      );
    });
  } catch {
    // Quota-exceeded / privacy mode — best-effort cleanup only.
  }
};

/** Deletes all locally stored Moment video media for one user from IndexedDB. */
export const clearMomentVideoMediaForUser = async (userId: number): Promise<void> => {
  await clearMomentVideoMediaDatabase(getMomentsVideoMediaDbName(userId));
};

/** Deletes legacy unscoped and all per-user Moment video media databases. */
export const clearAllMomentVideoMedia = async (): Promise<void> => {
  await clearMomentVideoMediaDatabase(LEGACY_MOMENTS_VIDEO_MEDIA_DB_NAME);

  if (typeof indexedDB === 'undefined' || !('databases' in indexedDB)) {
    return;
  }

  const databases = await indexedDB.databases();
  await Promise.all(
    databases
      .map((database) => database.name)
      .filter((name): name is string => typeof name === 'string')
      .filter((name) => name.startsWith(`${MOMENTS_VIDEO_MEDIA_DB_NAME_PREFIX}.`))
      .map((name) => clearMomentVideoMediaDatabase(name)),
  );
};
