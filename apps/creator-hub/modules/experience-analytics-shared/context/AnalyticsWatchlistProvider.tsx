import type { FunctionComponent } from 'react';
import React, { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import type { Watchlist, WatchlistType } from '@rbx/client-analytics-watchlists/v1';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import useApiRequest from '../hooks/useApiRequest';
import { useAnalyticsWatchlistsClient } from './AnalyticsWatchlistsClientProvider';

type AnalyticsWatchlistProviderState = {
  currentWatchlist: Watchlist | null;
  upsertWatchlist: (itemIds: string[], skipAwaitResponse?: boolean) => Promise<void>;
  addItem: (itemId: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  watchlistContains: (itemId: string) => boolean;
} & GenericChartState;

const uninitializedFunction = () => {
  throw new Error('Analytics Watchlist context not properly initialized');
};
export const AnalyticsWatchlistProviderContext = createContext<AnalyticsWatchlistProviderState>({
  currentWatchlist: null,
  isDataLoading: false,
  isUserForbidden: false,
  isResponseFailed: false,
  upsertWatchlist: uninitializedFunction,
  addItem: uninitializedFunction,
  removeItem: uninitializedFunction,
  watchlistContains: uninitializedFunction,
});

export const useAnalyticsWatchlist = () => {
  return useContext(AnalyticsWatchlistProviderContext);
};

const AnalyticsWatchlistProvider: FunctionComponent<
  React.PropsWithChildren<{ watchlistType: WatchlistType }>
> = ({ watchlistType, children }) => {
  const { analyticsWatchlistsClient } = useAnalyticsWatchlistsClient();
  const fetchWatchlist = useCallback(
    () => analyticsWatchlistsClient.getWatchlist({ watchlistType }),
    [analyticsWatchlistsClient, watchlistType],
  );
  const [currentWatchlist, setCurrentWatchlist] = useState<Watchlist | null>(null);
  const {
    data: fetchWatchlistResult,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
  } = useApiRequest(fetchWatchlist);
  useEffect(() => {
    if (fetchWatchlistResult !== null) {
      setCurrentWatchlist(fetchWatchlistResult);
    }
  }, [fetchWatchlistResult]);

  const upsertWatchlist = useCallback(
    async (itemIds: string[], skipAwaitResponse = false) => {
      // update watchlist first for reorders
      if (skipAwaitResponse) {
        setCurrentWatchlist((watchlist) => ({
          id: watchlist?.id,
          watchlistType: watchlist?.watchlistType,
          watchlistItems: {
            itemIds,
          },
        }));
      }
      const upsertResult = await analyticsWatchlistsClient.upsertWatchlist({
        watchlistType,
        watchlistItemsItemIds: itemIds,
      });
      setCurrentWatchlist(upsertResult);
    },
    [analyticsWatchlistsClient, watchlistType],
  );

  const addItem = useCallback(
    async (itemId: string) => {
      if (
        !currentWatchlist?.watchlistItems?.itemIds ||
        currentWatchlist?.watchlistItems?.itemIds?.includes(itemId)
      ) {
        return;
      }
      upsertWatchlist([...currentWatchlist.watchlistItems.itemIds, itemId]);
    },
    [currentWatchlist?.watchlistItems?.itemIds, upsertWatchlist],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (
        !currentWatchlist?.watchlistItems?.itemIds ||
        !currentWatchlist?.watchlistItems?.itemIds?.includes(itemId)
      ) {
        return;
      }
      upsertWatchlist(currentWatchlist.watchlistItems.itemIds.filter((id) => id !== itemId));
    },
    [currentWatchlist?.watchlistItems?.itemIds, upsertWatchlist],
  );

  const watchlistContains = useCallback(
    (itemId: string) => currentWatchlist?.watchlistItems?.itemIds?.includes(itemId) ?? false,
    [currentWatchlist?.watchlistItems?.itemIds],
  );

  const context = useMemo(() => {
    return {
      currentWatchlist,
      isDataLoading,
      isResponseFailed,
      isUserForbidden,
      upsertWatchlist,
      addItem,
      removeItem,
      watchlistContains,
    };
  }, [
    addItem,
    currentWatchlist,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    removeItem,
    upsertWatchlist,
    watchlistContains,
  ]);
  return (
    <AnalyticsWatchlistProviderContext.Provider value={context}>
      {children}
    </AnalyticsWatchlistProviderContext.Provider>
  );
};

export default AnalyticsWatchlistProvider;
