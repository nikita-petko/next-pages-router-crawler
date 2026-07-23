import passesClient, { type GamePassConfigV2 } from '@modules/clients/passes';
import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, gamePassKeys } from './constants';

// Generalizing final data type for `select` transformations.
type Options<TData = GamePassConfigV2[]> = Omit<
  UseQueryOptions<GamePassConfigV2[], Error, TData>,
  'queryKey' | 'queryFn'
> & {
  limit?: number;
};

const PAGINATION_LIMIT = 400;

async function getAllPassesForUniverse(
  universeId: number,
  { limit = PAGINATION_LIMIT }: { limit?: number },
): Promise<GamePassConfigV2[]> {
  // Errors will be propagated to the caller
  let response = await passesClient.listGamePassConfigsByUniverse({
    universeId,
    pageSize: limit,
  });

  let passes = response.gamePasses;
  while (response.nextPageToken) {
    // eslint-disable-next-line no-await-in-loop -- we want to fetch the next page sequentially
    response = await passesClient.listGamePassConfigsByUniverse({
      universeId,
      pageSize: limit,
      pageToken: response.nextPageToken,
    });
    passes = passes.concat(response.gamePasses);
  }

  return passes;
}

export function getAllPassesForUniverseQueryOptions<TData = GamePassConfigV2[]>(
  params: { universeId: number; limit?: number },
  options?: Options<TData>,
) {
  const { universeId, limit } = params;
  return queryOptions<GamePassConfigV2[], Error, TData>({
    queryKey: gamePassKeys.listAll(universeId, { limit }),
    queryFn: async () => getAllPassesForUniverse(universeId, { limit }),
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRIES,
    ...options,
  });
}

/** General query hook for fetching all passes for a universe. */
export function useGetAllPassesForUniverse<TData = GamePassConfigV2[]>(
  universeId: number,
  { limit, ...options }: Options<TData> = {},
) {
  return useQuery(getAllPassesForUniverseQueryOptions({ universeId, limit }, options));
}
