export const maxIPsAllowed = 10;

// for the cursor pager page size (i.e. we page by 10 items through the cache)
export const getApiKeysPageSize = 10;

// due to LIST being an expensive BE operation, load page size will match the cache page size
// this means instead of loading n number of keys up front and paging through the cache,
// we load 10 at a time and make a new network call each time the user pages forward
export const getApiKeysLoadPageSize = 10;

export const TOAST_AUTO_HIDE_DURATION_MILLISECONDS = 4000;

// max input lengths
export const maxNameInputLength = 64;
export const maxDescriptionLength = 1000;
export const descriptionNumRows = 2;

// If a user is forgotten (by GDPR RtbF requests), we use this as the user ID.
export const forgottenUserId = 0;

// User ID for people who perform operations on behalf of Roblox.
export const robloxAdminUserId = 1;
export const robloxAdminDisplayName = 'Roblox';

export const WildcardTargetPart = '*';
