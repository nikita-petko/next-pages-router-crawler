import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { UniversePinnedPrice } from '@rbx/client-price-configuration-api/v1';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { isPollingStatus } from '../utils/priceValidationStatusUtils';
import { queryRetry, pollingInterval, getUniversePinnedPriceQueryKey } from './constants';

type Options<TData = UniversePinnedPrice> = Omit<
  UseQueryOptions<UniversePinnedPrice, Error, TData>,
  'queryKey' | 'queryFn' | 'refetchInterval' | 'select'
> & {
  skipPollingForDisable?: boolean;
};

export function useGetUniversePinnedPrice(
  universeId: number,
  { skipPollingForDisable, ...options }: Options = {},
) {
  return useQuery<UniversePinnedPrice>({
    queryKey: getUniversePinnedPriceQueryKey(universeId),
    queryFn: ({ signal }) => priceConfigurationApi.getUniversePinnedPrice(universeId, { signal }),
    refetchInterval: ({ state }) => {
      const universePinnedPrice = state.data;

      // Skip polling on disable for warning modal on PO page
      if (skipPollingForDisable && universePinnedPrice?.status === 'Disabling') {
        return false;
      }

      // Poll and refetch for certain states
      if (isPollingStatus(universePinnedPrice?.status)) {
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
