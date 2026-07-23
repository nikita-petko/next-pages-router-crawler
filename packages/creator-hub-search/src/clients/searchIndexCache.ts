/**
 * IndexedDB cache layer for the serialized MiniSearch index.
 *
 * Provides user-isolated, persistent caching with TTL-based expiration.
 * Falls back gracefully when IndexedDB is unavailable (e.g. private browsing).
 */

const DB_NAME = 'creator-hub-search';
const DB_VERSION = 1;
const STORE_NAME = 'search-index';

/** 15 minutes */
export const CACHE_TTL_MS = 15 * 60 * 1000;

export interface CachedIndex {
  serializedIndex: string;
  experienceFingerprint: string;
  createdAt: number;
}

interface CacheEntry extends CachedIndex {
  userId: number;
}

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const getSearchIndexCache = async (userId: number): Promise<CachedIndex | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(userId);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
          resolve(null);
          return;
        }
        const { serializedIndex, experienceFingerprint, createdAt } = entry;
        resolve({ serializedIndex, experienceFingerprint, createdAt });
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const setSearchIndexCache = async (userId: number, data: CachedIndex): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ ...data, userId } satisfies CacheEntry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // IndexedDB unavailable — silently skip
    return undefined;
  }
};

export const clearSearchIndexCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // IndexedDB unavailable — silently skip
    return undefined;
  }
};

/**
 * Generates a fingerprint from a sorted list of experience IDs.
 * Used to detect when the user's experience set has changed.
 */
export const computeExperienceFingerprint = (experienceIds: string[]): string => {
  const sorted = [...experienceIds].sort();
  return sorted.join(',');
};
