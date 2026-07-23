/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getTaxDevexStatus, type GetTaxDevexStatusResponse } from '@modules/clients/creatorTaxApi';

const TAX_DEVEX_STATUS_STALE_TIME_MS = 5 * 60 * 1000;

type Options<TData = GetTaxDevexStatusResponse> = Omit<
  UseQueryOptions<GetTaxDevexStatusResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

export function useGetTaxDevexStatus<TData = GetTaxDevexStatusResponse>(
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: ['devex', 'taxDevexStatus'] as const,
    queryFn: () => getTaxDevexStatus(),
    retry: 2,
    retryDelay: 0,
    staleTime: TAX_DEVEX_STATUS_STALE_TIME_MS,
    ...options,
  });
}
