/** The initial number of items to prefetch on first load. */
export const INITIAL_FETCH_TOTAL = 3000 as number;

/**
 * The default page size for the shop items list query.
 */
export const API_DEFAULT_PAGE_SIZE = 400 as number;

export const DEFAULT_RETRIES = 3 as number;

/** Stale time for shops queries. One hour so the tab refetches periodically. */
export const DEFAULT_STALE_TIME = 60 * 60 * 1000;

// Query keys for shops queries

export const shopsKeys = {
  all: ['shops'] as const, // base key for all shops queries

  byUniverse: (universeId: number) => [...shopsKeys.all, 'byUniverse', universeId] as const, // shop list for a universe

  items: () => [...shopsKeys.all, 'items'] as const, // all shop items in a universe
  itemsByShop: (shopId: number) => [...shopsKeys.items(), shopId] as const, // all shop item queries for one shop
  itemsByShopList: (shopId: number, params?: { pageSize?: number }) =>
    [...shopsKeys.itemsByShop(shopId), 'list', params] as const, // a specific page-sized list query

  // Disjoint from `items` so a config invalidation never busts item pages
  config: () => [...shopsKeys.all, 'config'] as const, // creator shop configs across shops
  configByShop: (shopId: number) => [...shopsKeys.config(), shopId] as const, // one shop's full config (incl. categories)
} as const;
