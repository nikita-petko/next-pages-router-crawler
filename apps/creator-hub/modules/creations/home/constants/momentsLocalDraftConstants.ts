/** Prefix for per-user browser-persisted Moments records (drafts and locally tracked uploads). */
export const MOMENTS_LOCAL_STORAGE_KEY_PREFIX = 'CreatorHub.MomentsCreations.local';

/** Legacy unscoped localStorage key. Used for one-time migration and global cleanup only. */
export const LEGACY_MOMENTS_LOCAL_STORAGE_KEY = 'CreatorHub.MomentsCreations.local';

/** Bump when the persisted schema changes to invalidate stale entries. */
export const MOMENTS_LOCAL_STORAGE_VERSION = '1';

/** Returns the localStorage key for a signed-in user's Moments drafts. */
export const getMomentsLocalStorageKey = (userId: number): string =>
  `${MOMENTS_LOCAL_STORAGE_KEY_PREFIX}.${userId}`;

/** Inert localStorage key used while logged out so auth state does not touch user data. */
export const MOMENTS_LOCAL_STORAGE_INACTIVE_KEY = `${MOMENTS_LOCAL_STORAGE_KEY_PREFIX}.__inactive__`;
