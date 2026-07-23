/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type {
  DeveloperProductConfigV2,
  DeveloperProductsGetDeveloperProductConfigV2Request,
} from '@rbx/client-developer-products-api/v1';
import developerProductsClient from '@modules/clients/developerProducts';
import { DEFAULT_RETRIES, developerProductKeys } from './constants';

type UseGetDeveloperProductConfigParams = DeveloperProductsGetDeveloperProductConfigV2Request;

type Options<TData = DeveloperProductConfigV2> = Omit<
  UseQueryOptions<DeveloperProductConfigV2, Error, TData>,
  'queryKey' | 'queryFn'
>;

export function useGetDeveloperProductConfig<TData = DeveloperProductConfigV2>(
  { universeId, productId }: UseGetDeveloperProductConfigParams,
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: developerProductKeys.config(universeId, productId),
    queryFn: ({ signal }) =>
      developerProductsClient.getDeveloperProductConfig({ universeId, productId }, { signal }),
    retry: DEFAULT_RETRIES,
    ...options,
  });
}
