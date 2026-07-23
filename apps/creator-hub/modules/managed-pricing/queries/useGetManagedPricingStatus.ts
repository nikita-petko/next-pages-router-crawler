import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { GetManagedPricingStatusResponse } from '@rbx/client-price-configuration-api/v1';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { managedPricingKeys } from './constants';

// Only expose picked options for now
type Options<TData = GetManagedPricingStatusResponse> = Omit<
  UseQueryOptions<GetManagedPricingStatusResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour - this should not change frequently

export function useGetManagedPricingStatus<TData = GetManagedPricingStatusResponse>(
  universeId: number | undefined,
  options: Options<TData> = {},
) {
  // oxlint-disable typescript/no-non-null-assertion -- guaranteed with enabled
  return useQuery({
    queryKey: managedPricingKeys.managedPricingStatus(universeId!),
    queryFn: ({ signal }) => priceConfigurationApi.getManagedPricingStatus(universeId!, { signal }),
    staleTime: STALE_TIME_MS,
    ...options,
    enabled: !!universeId && universeId > 0 && (options.enabled ?? true),
  });
}
