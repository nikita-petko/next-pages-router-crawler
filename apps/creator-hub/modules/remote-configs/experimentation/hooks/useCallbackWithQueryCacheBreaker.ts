import type { QueryCache } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

/**
 * Returns a memoized callback that is automatically recreated whenever the query cache is updated for any query key matching the specified prefix.
 *
 * @param fn - The callback function to memoize.
 * @param dependencies - Dependency array for the callback.
 * @param cache - The QueryCache instance to subscribe to for updates.
 * @param queryKeyPrefix - The prefix to match against the query keys in the cache.
 * @returns A memoized callback that is refreshed when relevant query cache entries change.
 */

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- Using Function type for generic callback compatibility
const useCallbackWithQueryCacheBreaker = <T extends Function>(
  fn: Parameters<typeof useCallback<T>>[0],
  dependencies: Parameters<typeof useCallback<T>>[1],
  cache: QueryCache,
  queryKeyPrefix: string,
) => {
  const [queryCacheBreaker, setQueryCacheBreaker] = useState(0);

  useEffect(() => {
    return cache.subscribe(({ query }) => {
      const { queryKey } = query;
      if (Array.isArray(queryKey) && queryKey[0] === queryKeyPrefix) {
        setQueryCacheBreaker((prev) => prev + 1);
      } else if (typeof queryKey === 'string' && queryKey === queryKeyPrefix) {
        setQueryCacheBreaker((prev) => prev + 1);
      }
    });
  }, [cache, queryKeyPrefix]);

  return useCallback(fn, [fn, queryCacheBreaker, ...dependencies]);
};

export default useCallbackWithQueryCacheBreaker;
