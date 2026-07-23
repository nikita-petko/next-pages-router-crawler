import passesClient from '@modules/clients/passes';
import type { BatchGetGamePassConfigsResponse } from '@modules/clients/passes';
import { QueryClient, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, gamePassKeys } from './constants';

type UseBatchGetGamePassConfigsParams = {
  universeId: number;
  gamePassIds: number[];
};

type Options<TData = BatchGetGamePassConfigsResponse> = Omit<
  UseQueryOptions<BatchGetGamePassConfigsResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

// TODO: integrate into analytics queries, and update to use new batch get v2
// After the query succeeds, populate the individual caches for the game pass configs.
// If we do not do this, if we need to get a single game pass config, it will not be available in the cache.
function populateIndividualCaches(
  data: BatchGetGamePassConfigsResponse,
  context: { queryClient: QueryClient; universeId: number },
) {
  data.gamePasses.forEach((config) => {
    // Set for individual game pass config
    context.queryClient.setQueryData(
      gamePassKeys.config(context.universeId, config.gamePassId),
      config,
    );

    // Set for batch game pass configs on single game pass
    context.queryClient.setQueryData(
      gamePassKeys.batchConfigs(context.universeId, [config.gamePassId]),
      { gamePasses: [config] } satisfies BatchGetGamePassConfigsResponse,
    );
  });
}

// eslint-disable-next-line import/prefer-default-export -- keep named export
export function useBatchGetGamePassConfigs<TData = BatchGetGamePassConfigsResponse>(
  { universeId, gamePassIds }: UseBatchGetGamePassConfigsParams,
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: gamePassKeys.batchConfigs(universeId, gamePassIds),
    queryFn: async ({ signal, client: queryClient }) => {
      const response = await passesClient.batchGetGamePassConfigs(
        { universeId, gamePassIds },
        { signal },
      );
      populateIndividualCaches(response, { queryClient, universeId });
      return response;
    },
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRIES,
    ...options,
    enabled: gamePassIds.length > 0 && (options.enabled ?? true),
  });
}
