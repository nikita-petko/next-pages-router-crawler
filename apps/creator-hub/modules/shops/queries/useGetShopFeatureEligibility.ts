import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { GetShopFeatureEligibilityResponse } from '@rbx/client-shops-api/v1';
import shopsApiClient from '@modules/clients/shops';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, shopsKeys } from './constants';

type Options<TData = GetShopFeatureEligibilityResponse> = Omit<
  UseQueryOptions<GetShopFeatureEligibilityResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

export function useGetShopFeatureEligibility<TData = GetShopFeatureEligibilityResponse>(
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: shopsKeys.eligibility(),
    queryFn: ({ signal }) => shopsApiClient.getShopFeatureEligibility({ signal }),
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}
