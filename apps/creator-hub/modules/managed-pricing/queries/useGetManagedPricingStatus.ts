/* istanbul ignore file */
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { type GetManagedPricingStatusResponse } from '@rbx/clients/priceConfigurationApi/v1';
import { queryKeys } from './constants';

// Only expose picked options for now
type Options<TData = GetManagedPricingStatusResponse> = Pick<
  UseQueryOptions<GetManagedPricingStatusResponse, Error, TData>,
  'enabled'
>;

const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour - this should not change frequently

export function useGetManagedPricingStatus(
  universeId: number | undefined,
  { enabled = true }: Options = {},
) {
  return useQuery({
    queryKey: queryKeys.managedPricingStatus(universeId!),
    queryFn: ({ signal }) => priceConfigurationApi.getManagedPricingStatus(universeId!, { signal }),
    enabled: enabled && !!universeId,
    staleTime: STALE_TIME_MS,
  });
}

export default useGetManagedPricingStatus;
