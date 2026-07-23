import { useCallback, useRef, useState } from 'react';

/**
 * Fetches from a bulk API while caching per-item. Batches bulk
 * fetches into chunks based on maxBatchSize.
 *
 * @example
 * ```ts
 * const { fetchItems, isFetching } = useCachedBatchFetcher({
 *   batchFetch: async (userIds) => {
 *     const response = await api.getUsers(userIds);
 *     return new Map(response.users.map(u => [u.id, u]));
 *   },
 *   maxBatchSize: 100,
 * });
 *
 * const results = await fetchItems([1, 2, 3]);
 * ```
 */
export interface UseCachedBatchFetcherOptions<TKey extends string | number, TValue> {
  /**
   * Function that fetches a batch of items by their keys
   * Should return a Map of key -> value
   */
  batchFetch: (keys: TKey[]) => Promise<Map<TKey, TValue>>;

  /**
   * Maximum number of items to fetch in a single batch
   * @default 100
   */
  maxBatchSize?: number;

  /**
   * Optional stable identifier for the cache.
   * When this changes, the cache is cleared
   */
  cacheKey?: string;
}

export interface UseCachedBatchFetcherResult<TKey extends string | number, TValue> {
  /**
   * Fetch items by their keys
   * Returns a Map of key -> value for the requested keys
   * Cached items are returned immediately, uncached items are fetched
   */
  fetchItems: (keys: TKey[]) => Promise<Map<TKey, TValue>>;
  isFetching: boolean;
  clearCache: () => void;
}

const useCachedBatchFetcher = <TKey extends string | number, TValue>({
  batchFetch,
  maxBatchSize = 100,
  cacheKey,
}: UseCachedBatchFetcherOptions<TKey, TValue>): UseCachedBatchFetcherResult<TKey, TValue> => {
  const cache = useRef<Map<TKey, TValue>>(new Map());
  const fetchingKeys = useRef<Set<TKey>>(new Set());
  const [isFetching, setIsFetching] = useState(false);
  const previousCacheKey = useRef(cacheKey);

  // Clear cache when cacheKey changes
  if (previousCacheKey.current !== cacheKey) {
    cache.current.clear();
    fetchingKeys.current.clear();
    previousCacheKey.current = cacheKey;
  }

  const clearCache = useCallback(() => {
    cache.current.clear();
    fetchingKeys.current.clear();
  }, []);

  const fetchItems = useCallback(
    async (keys: TKey[]): Promise<Map<TKey, TValue>> => {
      const resultMap = new Map<TKey, TValue>();

      if (keys.length === 0) {
        return resultMap;
      }

      // Deduplicate keys
      const uniqueKeys = Array.from(new Set(keys));

      // Filter out keys that are already cached or currently being fetched
      const uncachedKeys = uniqueKeys.filter(
        (key) => !cache.current.has(key) && !fetchingKeys.current.has(key),
      );

      // Return cached results for keys that are already available
      uniqueKeys.forEach((key) => {
        const cachedValue = cache.current.get(key);
        if (cachedValue !== undefined) {
          resultMap.set(key, cachedValue);
        }
      });

      if (uncachedKeys.length === 0) {
        return resultMap;
      }

      // Mark keys as being fetched
      uncachedKeys.forEach((key) => fetchingKeys.current.add(key));
      setIsFetching(true);

      try {
        // Split into batches if needed
        const batches: TKey[][] = [];
        for (let i = 0; i < uncachedKeys.length; i += maxBatchSize) {
          batches.push(uncachedKeys.slice(i, i + maxBatchSize));
        }

        // Fetch all batches in parallel (throws on any failure)
        const batchResults = await Promise.all(batches.map((batch) => batchFetch(batch)));

        // Merge results and update cache
        batchResults.forEach((batchResult) => {
          batchResult.forEach((value, key) => {
            cache.current.set(key, value);
            resultMap.set(key, value);
          });
        });

        return resultMap;
      } finally {
        // Clean up fetching state
        uncachedKeys.forEach((key) => fetchingKeys.current.delete(key));
        setIsFetching(fetchingKeys.current.size > 0);
      }
    },
    [batchFetch, maxBatchSize],
  );

  return {
    fetchItems,
    isFetching,
    clearCache,
  };
};

export default useCachedBatchFetcher;
