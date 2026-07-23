import { queryOptions, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import passesClient, { type GamePassConfigV2 } from '@modules/clients/passes';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, gamePassKeys } from './constants';

type ListAllPassesParams = {
  pageSize?: number;
  isArchived?: boolean;
};

// Generalizing final data type for `select` transformations.
type Options<TData = GamePassConfigV2[]> = Omit<
  UseQueryOptions<GamePassConfigV2[], Error, TData>,
  'queryKey' | 'queryFn'
> &
  ListAllPassesParams;

const DEFAULT_PAGE_SIZE = 400;

async function listAllPassesForUniverse(
  universeId: number,
  { pageSize = DEFAULT_PAGE_SIZE, isArchived }: ListAllPassesParams,
): Promise<GamePassConfigV2[]> {
  const request = {
    universeId,
    pageSize,
    isArchived,
  };

  // Errors will be propagated to the caller
  let response = await passesClient.listGamePassConfigsByUniverse(request);

  let passes = response.gamePasses;
  while (response.nextPageToken) {
    response = await passesClient.listGamePassConfigsByUniverse({
      ...request,
      pageToken: response.nextPageToken,
    });
    passes = passes.concat(response.gamePasses);
  }

  return passes;
}

export function listAllPassesForUniverseQueryOptions<TData = GamePassConfigV2[]>(
  params: { universeId: number } & ListAllPassesParams,
  options?: Options<TData>,
) {
  const { universeId, pageSize, isArchived } = params;
  return queryOptions<GamePassConfigV2[], Error, TData>({
    queryKey: gamePassKeys.listAll(universeId, { pageSize, isArchived }),
    queryFn: async () => listAllPassesForUniverse(universeId, { pageSize, isArchived }),
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRIES,
    ...options,
  });
}

/** General query hook for fetching all passes for a universe. */
export function useListAllPassesForUniverse<TData = GamePassConfigV2[]>(
  universeId: number,
  { pageSize, isArchived, ...options }: Options<TData> = {},
) {
  return useQuery(
    listAllPassesForUniverseQueryOptions({ universeId, pageSize, isArchived }, options),
  );
}
