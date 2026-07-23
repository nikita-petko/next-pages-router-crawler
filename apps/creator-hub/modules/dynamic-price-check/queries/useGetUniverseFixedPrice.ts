/* istanbul ignore file */
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { type GetUniverseFixedPriceResponse } from '@rbx/clients/priceConfigurationApi/v1';
import { queryRetry, pollingInterval, getUniverseFixedPriceQueryKey } from './constants';
import { isPollingStatus } from '../utils/priceValidationStatusUtils';

type Options<TData = GetUniverseFixedPriceResponse> = Omit<
  UseQueryOptions<GetUniverseFixedPriceResponse, Error, TData>,
  'queryKey' | 'queryFn' | 'refetchInterval' | 'select'
> & {
  skipPollingForDisable?: boolean;
};

export default function useGetUniverseFixedPrice(
  universeId: number,
  { skipPollingForDisable, ...options }: Options = {},
) {
  return useQuery<GetUniverseFixedPriceResponse>({
    queryKey: getUniverseFixedPriceQueryKey(universeId),
    queryFn: ({ signal }) => priceConfigurationApi.getUniverseFixedPrice(universeId, { signal }),
    refetchInterval: ({ state }) => {
      const universeFixedPrice = state.data;
      // Skip polling on disable for warning modal on PO page
      if (skipPollingForDisable && universeFixedPrice?.status === 'Disabling') {
        return false;
      }
      // Poll and refetch for certain states
      if (isPollingStatus(universeFixedPrice?.status)) {
        return pollingInterval;
      }
      return false;
    },
    retry: queryRetry,
    ...options,
    staleTime: options.refetchOnWindowFocus ? 0 : Infinity,
    enabled: (options.enabled ?? true) && !!universeId,
  });
}
