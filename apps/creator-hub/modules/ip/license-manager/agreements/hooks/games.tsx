import { gamesClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';
import { createSimpleDebouncedCombinedAPICall } from '@modules/clients/utils';

/**
 * Returned from debouncedGameDetails when the game is NOT found.
 * We could also consider throwing an error instead.
 */
export const NO_GAME_FOUND_FOR_ID = 'NO_GAME_FOUND_FOR_ID' as const;

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
  });
};
