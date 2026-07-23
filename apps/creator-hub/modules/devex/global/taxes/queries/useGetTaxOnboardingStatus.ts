/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  getTaxOnboardingStatus,
  type GetTaxOnboardingStatusResponse,
} from '@modules/clients/creatorTaxApi';

type Options<TData = GetTaxOnboardingStatusResponse> = Omit<
  UseQueryOptions<GetTaxOnboardingStatusResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

export const getTaxOnboardingStatusQueryKey = () => ['devex', 'taxOnboardingStatus'] as const;

export function useGetTaxOnboardingStatus<TData = GetTaxOnboardingStatusResponse>(
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: getTaxOnboardingStatusQueryKey(),
    queryFn: () => getTaxOnboardingStatus(),
    retry: 2,
    retryDelay: 0,
    ...options,
  });
}
