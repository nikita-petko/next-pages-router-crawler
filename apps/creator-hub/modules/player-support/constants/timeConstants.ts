export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
export const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
// 5 minute refresh time
export const DEFAULT_STALE_TIME_MS = 5 * SECONDS_PER_MINUTE * 1000;

// Retry policy for idempotent mutations
export const IDEMPOTENT_RETRY_COUNT = 1;
export const IDEMPOTENT_RETRY_BASE_DELAY_MS = 1000;
export const IDEMPOTENT_RETRY_MAX_DELAY_MS = 4000;
