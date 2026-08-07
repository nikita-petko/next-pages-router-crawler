/** IndexedDB database name prefix for locally stored Moments video/thumbnail blobs. */
export const MOMENTS_VIDEO_MEDIA_DB_NAME_PREFIX = 'CreatorHub.MomentsVideoMedia';

/** Legacy unscoped IndexedDB name. Migrated to per-user databases on sign-in. */
export const LEGACY_MOMENTS_VIDEO_MEDIA_DB_NAME = 'CreatorHub.MomentsVideoMedia';

export const MOMENTS_VIDEO_MEDIA_DB_VERSION = 1;

/** Returns the IndexedDB database name for a signed-in user's locally stored media. */
export const getMomentsVideoMediaDbName = (userId: number): string =>
  `${MOMENTS_VIDEO_MEDIA_DB_NAME_PREFIX}.${userId}`;

export const MOMENTS_VIDEO_MEDIA_STORE_NAME = 'momentMedia';

/** Width of the inline table thumbnail (px). */
export const MOMENT_VIDEO_THUMBNAIL_SIZE_PX = 48;

/** Max width of the hover preview popover video (px). */
export const MOMENT_VIDEO_HOVER_PREVIEW_MAX_WIDTH_PX = 120;

/** Max height of the hover preview popover video (px). */
export const MOMENT_VIDEO_HOVER_PREVIEW_MAX_HEIGHT_PX = 160;

/** Height of the edit-drawer moment video preview container (px). */
export const MOMENT_VIDEO_EDIT_DRAWER_PREVIEW_HEIGHT_PX = 240;
