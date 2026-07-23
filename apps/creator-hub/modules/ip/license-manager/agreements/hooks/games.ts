import { useQuery } from '@tanstack/react-query';
import gamesClient from '@modules/clients/games';
import { createSimpleDebouncedCombinedAPICall } from '@modules/clients/utils';

/**
 * Returned from debouncedGameDetails when the game is NOT found.
 * We could also consider throwing an error instead.
 */
export const NO_GAME_FOUND_FOR_ID = 'NO_GAME_FOUND_FOR_ID' as const;

/** Batched row loads share this cache; avoid refetch when drawers mount (e.g. match details). */
const GAME_DETAILS_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * A debounced API call that combines multiple game details requests into a single API call.
 * Since we're calling this for each row, it's nice to avoid making #rows API calls.
 */
const debouncedGameDetails = createSimpleDebouncedCombinedAPICall({
  apiCall: gamesClient.getDetails,
  maxBatchSize: 50,
  getResult: (results, universeId) => {
    const game = results?.data?.find((aGame) => aGame.id === universeId);
    if (!game) {
      return NO_GAME_FOUND_FOR_ID;
    }
    return game;
  },
});

/**
 * A hook that returns the game details for a given universe ID.
 * The game details are debounced/batched to avoid making too many API calls so
 * you can use it components such as Rows.
 */
export const useDebouncedGameDetails = (universeId?: number) => {
  return useQuery({
    queryKey: ['game', universeId],
    queryFn: () => {
      if (universeId === undefined) {
        throw new Error('universeId is required');
      }
      return debouncedGameDetails(universeId);
    },
    enabled: Number.isFinite(universeId),
    // Real game details are cached (batched row loads share this cache; avoid refetch when drawers
    // like match details mount). However, a transient "not found" (e.g. an empty/rate-limited
    // response on rapid refresh of the preview page) must not stick in the shared cache and leak
    // into other views such as the matches table. Treat the not-found sentinel as immediately stale
    // so it refetches on the next mount and self-corrects instead of requiring a hard refresh.
    staleTime: (query) =>
      query.state.data === NO_GAME_FOUND_FOR_ID ? 0 : GAME_DETAILS_STALE_TIME_MS,
  });
};
