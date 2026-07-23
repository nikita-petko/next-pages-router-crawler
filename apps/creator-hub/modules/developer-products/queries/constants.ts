import type { Query } from '@tanstack/react-query';

export const DEFAULT_RETRIES = 3 as number;

/** The default page size for the developer product list query */
export const DEFAULT_PAGE_SIZE = 400 as number;

/**
 * The initial number of developer products to prefetch on first load.
 *
 * Note this will cause at most `ceil(INITIAL_FETCH_TOTAL / DEFAULT_PAGE_SIZE)` pages to be fetched sequentially.
 */
export const INITIAL_FETCH_TOTAL = 3000 as number;

/** Default stale time for individual queries */
export const DEFAULT_STALE_TIME = 10 * 60 * 1000; // 10 minutes

/** Maximum number of allowable writes for the server */
export const MAX_WRITE_LIMIT = 50 as number;

/**
 * Maximum allowable number of products to update in total.
 *
 * Note this is a hard limit to prevent abuse and is only possible through current
 * batching implementation + configuration.
 */
export const BULK_UPDATE_LIMIT = 3000 as number;

/** Query keys for the developer product queries */
export const developerProductKeys = {
  all: (universeId: number) => ['universes', universeId, 'developerproducts'] as const,
  list: (universeId: number, params: { pageSize?: number; isArchived?: boolean }) =>
    [...developerProductKeys.all(universeId), 'list', params] as const,
  config: (universeId: number, productId: number) =>
    [...developerProductKeys.all(universeId), 'config', productId] as const,
  batchConfigs: (universeId: number, productIds: number[]) =>
    // Sort the product IDs to ensure consistent query keys
    [
      ...developerProductKeys.all(universeId),
      'batchConfigs',
      [...productIds].sort((a, b) => a - b),
    ] as const,
  create: (universeId: number) => [...developerProductKeys.all(universeId), 'create'] as const,
  update: (universeId: number, productId: number) =>
    [...developerProductKeys.all(universeId), productId, 'update'] as const,
  batchUpdate: (universeId: number) =>
    [...developerProductKeys.all(universeId), 'batchUpdate'] as const,
} as const;

/**
 * Predicate that matches any `developerProductKeys.list(universeId, ...)` query.
 * Key shape: `['universes', universeId, 'developerproducts', 'list', { pageSize?: number; isArchived?: boolean }]`
 */
export function matchesDeveloperProductListQuery(query: Query, universeId: number): boolean {
  const key = query.queryKey;
  return (
    key[0] === 'universes' &&
    key[1] === universeId &&
    key[2] === 'developerproducts' &&
    key[3] === 'list'
  );
}

/**
 * Predicate that matches any `developerProductKeys.batchConfigs(universeId, ...)` query.
 * Key shape: `['universes', universeId, 'developerproducts', number[]]`
 */
export function matchesDeveloperProductBatchConfigsQuery(
  query: Query,
  universeId: number,
): boolean {
  const key = query.queryKey;
  return (
    key[0] === 'universes' &&
    key[1] === universeId &&
    key[2] === 'developerproducts' &&
    key[3] === 'batchConfigs' &&
    Array.isArray(key[4])
  );
}
