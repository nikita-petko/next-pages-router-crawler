import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import priceConfigurationApi, {
  type UniversePinnedLocation,
} from '@modules/clients/priceConfigurationApi';
import { isPollingStatus } from '../utils/priceValidationStatusUtils';
import { queryRetry, pollingInterval, getUniversePinnedLocationQueryKey } from './constants';

type Options<TData = UniversePinnedLocation> = Omit<
  UseQueryOptions<UniversePinnedLocation, Error, TData>,
  'queryKey' | 'queryFn' | 'refetchInterval' | 'select'
> & {
  skipPollingForDisable?: boolean;
};

export function useGetUniversePinnedLocation(
  universeId: number,
  { skipPollingForDisable, ...options }: Options = {},
) {
  return useQuery({
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
