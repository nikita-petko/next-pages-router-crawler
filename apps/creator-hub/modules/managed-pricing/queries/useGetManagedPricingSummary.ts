/* istanbul ignore file */
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { type GetManagedPricingSummaryResponse } from '@rbx/clients/priceConfigurationApi/v1';
import { DEFAULT_RETRIES, queryKeys } from './constants';

type Options<TData = GetManagedPricingSummaryResponse> = Omit<
  UseQueryOptions<GetManagedPricingSummaryResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour - this should not change frequently

export function useGetManagedPricingSummary<TData = GetManagedPricingSummaryResponse>(
  universeId: number,
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: queryKeys.managedPricingSummary(universeId),
    queryFn: ({ signal }) =>
      priceConfigurationApi.getManagedPricingSummary(universeId!, { signal }),
    retry: DEFAULT_RETRIES,
    staleTime: STALE_TIME_MS,
    ...options,
  });
}

export default useGetManagedPricingSummary;
