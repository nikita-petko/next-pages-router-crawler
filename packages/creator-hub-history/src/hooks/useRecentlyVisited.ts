/**
 * Convenience hook that fetches recently visited items on mount and
 * returns `{ items, loading, error, refresh }`. Wraps {@link useHistory}
 * so consumers don't need to manage fetch state themselves.
 */

import { useCallback, useEffect, useState } from 'react';
import type { HistoryItem } from '../schema';
import useHistory from './useHistory';

/**
 * Fetches recently visited items on mount and exposes the result with
 * loading / error states. Call `refresh()` to re-fetch after mutations.
 *
 * @param limit  Max items to return (defaults to config.maxItems).
 * @returns `{ items, loading, error, refresh }`
 */
const useRecentlyVisited = (limit?: number) => {
  const { getRecentlyVisited } = useHistory();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch on mount and whenever limit changes
  useEffect(() => {
    let mounted = true;

    const fetchItems = async () => {
      try {
        setLoading(true);
        const recentItems = await getRecentlyVisited(limit);
        if (mounted) {
          setItems(recentItems);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch recently visited'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchItems();

    // Prevent state updates after unmount
    return () => {
      mounted = false;
    };
  }, [limit, getRecentlyVisited]);

  /** Re-fetch the list (e.g. after adding/removing an item). */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const recentItems = await getRecentlyVisited(limit);
      setItems(recentItems);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch recently visited'));
    } finally {
      setLoading(false);
    }
  }, [limit, getRecentlyVisited]);

  return { items, loading, error, refresh };
};

export default useRecentlyVisited;
