/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { DevexEligibleData } from '@modules/clients/creatorDevexDataService';
import creatorDevexDataClient from '@modules/clients/creatorDevexDataService';

type Options<TData = DevexEligibleData> = Omit<
  UseQueryOptions<DevexEligibleData, Error, TData>,
  'queryKey' | 'queryFn'
>;

export function useGetDevexEligibleRobux<TData = DevexEligibleData>(options: Options<TData> = {}) {
  return useQuery({
    queryKey: ['devex', 'eligibleRobux'] as const,
    queryFn: () => creatorDevexDataClient.getDevexEligibleRobux(),
    retry: 2,
    retryDelay: 0,
    ...options,
  });
}
