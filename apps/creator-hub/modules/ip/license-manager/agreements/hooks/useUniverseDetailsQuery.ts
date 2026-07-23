import { useQuery } from '@tanstack/react-query';
import developClient from '@modules/clients/develop';

/** Shares the games-details staleness window so drawers/pages don't refetch on mount. */
const UNIVERSE_DETAILS_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Fetches a single universe by id from the develop/universes service.
 *
 * Unlike the public games API (`useDebouncedGameDetails`), this authorized single-id endpoint returns
 * real name/creator/rootPlaceId for content-restricted experiences on a cold fetch.
 */
export const useUniverseDetailsQuery = (universeId?: number) =>
  useQuery({
    queryKey: ['universeDetails', universeId],
    queryFn: () => {
      if (universeId === undefined || !Number.isFinite(universeId)) {
        throw new Error('universeId is required');
      }
      return developClient.getUniverseDetails(universeId);
    },
    enabled: universeId !== undefined && Number.isFinite(universeId),
    staleTime: UNIVERSE_DETAILS_STALE_TIME_MS,
    refetchOnMount: false,
  });
