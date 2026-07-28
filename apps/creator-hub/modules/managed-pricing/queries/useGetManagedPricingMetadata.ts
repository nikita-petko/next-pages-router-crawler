import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { GetManagedPricingMetadataResponse } from '@rbx/client-price-configuration-api/v1';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { DEFAULT_STALE_TIME, managedPricingKeys } from './constants';

type Options<TData = GetManagedPricingMetadataResponse> = Omit<
  UseQueryOptions<GetManagedPricingMetadataResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

// One quick retry, then let the caller fall back — a modal shouldn't sit in a loading state through a
// long retry backoff.
const RETRY_COUNT = 1;

export function useGetManagedPricingMetadata<TData = GetManagedPricingMetadataResponse>(
  universeId: number,
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: managedPricingKeys.managedPricingMetadata(universeId),
    queryFn: ({ signal }) =>
      priceConfigurationApi.getManagedPricingMetadata(universeId, { signal }),
    retry: RETRY_COUNT,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}
