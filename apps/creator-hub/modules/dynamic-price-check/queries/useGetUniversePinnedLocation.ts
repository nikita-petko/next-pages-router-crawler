/* istanbul ignore file */
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { type GetUniversePinnedLocationResponse } from '@rbx/clients/priceConfigurationApi/v1';
import { queryRetry, pollingInterval, getUniversePinnedLocationQueryKey } from './constants';
import { isPollingStatus } from '../utils/priceValidationStatusUtils';

type Options<TData = GetUniversePinnedLocationResponse> = Omit<
  UseQueryOptions<GetUniversePinnedLocationResponse, Error, TData>,
  'queryKey' | 'queryFn' | 'refetchInterval' | 'select'
> & {
  skipPollingForDisable?: boolean;
};

export default function useGetUniversePinnedLocation(
  universeId: number,
  { skipPollingForDisable, ...options }: Options = {},
) {
  return useQuery<GetUniversePinnedLocationResponse>({
    queryKey: getUniversePinnedLocationQueryKey(universeId),
    queryFn: ({ signal }) =>
      priceConfigurationApi.getUniversePinnedLocation(universeId, { signal }),
    refetchInterval: ({ state }) => {
      const universePinnedLocation = state.data;

      // Skip polling on disable for warning modal on PO page
      if (skipPollingForDisable && universePinnedLocation?.status === 'Disabling') {
        return false;
      }

      // Poll and refetch for certain states
      if (isPollingStatus(universePinnedLocation?.status)) {
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
