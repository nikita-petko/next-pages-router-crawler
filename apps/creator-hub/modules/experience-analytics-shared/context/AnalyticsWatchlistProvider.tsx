import type { FunctionComponent } from 'react';
import React, {
  useState,
  createContext,
  useContext,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
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

type FetchWatchlist = () => Promise<Watchlist>;

type WatchlistMutationState = {
  requestOwner: FetchWatchlist;
  watchlist: Watchlist;
};

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
  const [watchlistMutation, setWatchlistMutation] = useState<WatchlistMutationState | null>(null);
  const mutationGenerationRef = useRef(0);
  const {
    data: fetchWatchlistResult,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
  } = useApiRequest(fetchWatchlist);
  const fetchWatchlistResultRef = useRef(fetchWatchlistResult);
  useEffect(() => {
    fetchWatchlistResultRef.current = fetchWatchlistResult;
  });
  const currentWatchlist =
    watchlistMutation?.requestOwner === fetchWatchlist
      ? watchlistMutation.watchlist
      : fetchWatchlistResult;

  const upsertWatchlist = useCallback(
    async (itemIds: string[], skipAwaitResponse = false) => {
      mutationGenerationRef.current += 1;
      const mutationGeneration = mutationGenerationRef.current;
      // update watchlist first for reorders
      if (skipAwaitResponse) {
        setWatchlistMutation((previousMutation) => {
          const previousWatchlist =
            previousMutation?.requestOwner === fetchWatchlist
              ? previousMutation.watchlist
              : fetchWatchlistResultRef.current;
          return {
            requestOwner: fetchWatchlist,
            watchlist: {
              id: previousWatchlist?.id,
              watchlistType: previousWatchlist?.watchlistType,
              watchlistItems: {
                itemIds,
              },
            },
          };
        });
      }
      const upsertResult = await analyticsWatchlistsClient.upsertWatchlist({
        watchlistType,
        watchlistItemsItemIds: itemIds,
      });
      if (mutationGenerationRef.current !== mutationGeneration) {
        return;
      }
      setWatchlistMutation({ requestOwner: fetchWatchlist, watchlist: upsertResult });
    },
    [analyticsWatchlistsClient, fetchWatchlist, watchlistType],
  );

  const addItem = useCallback(
    async (itemId: string) => {
      if (
        !currentWatchlist?.watchlistItems?.itemIds ||
        currentWatchlist?.watchlistItems?.itemIds?.includes(itemId)
      ) {
        return;
      }
      void upsertWatchlist([...currentWatchlist.watchlistItems.itemIds, itemId]);
    },
    [currentWatchlist, upsertWatchlist],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (
        !currentWatchlist?.watchlistItems?.itemIds ||
        !currentWatchlist?.watchlistItems?.itemIds?.includes(itemId)
      ) {
        return;
      }
      void upsertWatchlist(currentWatchlist.watchlistItems.itemIds.filter((id) => id !== itemId));
    },
    [currentWatchlist, upsertWatchlist],
  );

  const watchlistContains = useCallback(
    (itemId: string) => currentWatchlist?.watchlistItems?.itemIds?.includes(itemId) ?? false,
    [currentWatchlist],
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
