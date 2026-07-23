export type CreatorHubSearchIxpParams = number | null;

/** Default when IXP omits or nulls `searchVersion` (matches navigation merge fallback). */
export const DEFAULT_CREATOR_HUB_SEARCH_VERSION = 1;

/** Minimum IXP searchVersion required to enable the Creator Store integration. */
export const STORE_SEARCH_MIN_VERSION = 3;
