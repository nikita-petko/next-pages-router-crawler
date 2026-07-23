/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  getOrCreateTaxOnboarding,
  type GetTaxOnboardingResultResponse,
} from '@modules/clients/creatorTaxApi';

type Options<TData = GetTaxOnboardingResultResponse> = Omit<
  UseQueryOptions<GetTaxOnboardingResultResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

export function useGetOrCreateTaxOnboarding<TData = GetTaxOnboardingResultResponse>(
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: ['devex', 'taxOnboarding'] as const,
    queryFn: ({ signal }) => getOrCreateTaxOnboarding({ signal }),
    retry: false,
    ...options,
  });
}
