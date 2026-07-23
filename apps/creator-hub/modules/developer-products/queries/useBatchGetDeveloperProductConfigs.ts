import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import developerProductsClient from '@modules/clients/developerProducts';
import type { BatchGetDeveloperProductConfigsResponse } from '@modules/clients/developerProducts';
import { DEFAULT_RETRIES, developerProductKeys } from './constants';

type UseBatchGetDeveloperProductConfigsParams = {
  universeId: number;
  productIds: number[];
};

type Options<TData = BatchGetDeveloperProductConfigsResponse> = Omit<
  UseQueryOptions<BatchGetDeveloperProductConfigsResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

// After the query succeeds, populate the individual caches for the developer product configs.
// If we do not do this, if we need to get a single developer product config, it will not be available in the cache.
function populateIndividualCaches(
  data: BatchGetDeveloperProductConfigsResponse,
  context: { queryClient: QueryClient; universeId: number },
) {
  data.developerProducts.forEach((config) => {
    // Set for individual developer product config
    context.queryClient.setQueryData(
      developerProductKeys.config(context.universeId, config.productId),
      config,
    );

    // Set for batch developer product configs on single developer product
    context.queryClient.setQueryData(
      developerProductKeys.batchConfigs(context.universeId, [config.productId]),
      { developerProducts: [config] } satisfies BatchGetDeveloperProductConfigsResponse,
    );
  });
}

export function useBatchGetDeveloperProductConfigs<TData = BatchGetDeveloperProductConfigsResponse>(
  { universeId, productIds }: UseBatchGetDeveloperProductConfigsParams,
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: developerProductKeys.batchConfigs(universeId, productIds),
    queryFn: async ({ signal, client: queryClient }) => {
      const response = await developerProductsClient.batchGetDeveloperProductConfigs(
        { universeId, productIds },
        { signal },
      );
      populateIndividualCaches(response, { queryClient, universeId });
      return response;
    },
    retry: DEFAULT_RETRIES,
    ...options,
    enabled: productIds.length > 0 && (options.enabled ?? true),
  });
}
