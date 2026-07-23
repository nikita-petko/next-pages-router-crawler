export const DEFAULT_RETRIES = 3;

// Default page limit for the subs list query
export const DEFAULT_PAGE_LIMIT = 50;

// Initial number of subs to prefetch on first load
export const INITIAL_FETCH_TOTAL = 100;

// Default stale time for individual queries (similar to dev products)
export const DEFAULT_STALE_TIME = 10 * 60 * 1000; // 10 minutes

// Query keys for the subs queries
export const subscriptionKeys = {
  all: (universeId: number) => ['universes', universeId, 'subscriptions'] as const,
  list: (universeId: number, params: { limit?: number }) =>
    [...subscriptionKeys.all(universeId), params] as const,
  details: (universeId: number, subscriptionId: string) =>
    [...subscriptionKeys.all(universeId), subscriptionId, 'details'] as const,
  priceInfo: (universeId: number) => [...subscriptionKeys.all(universeId), 'priceInfo'] as const,
} as const;
