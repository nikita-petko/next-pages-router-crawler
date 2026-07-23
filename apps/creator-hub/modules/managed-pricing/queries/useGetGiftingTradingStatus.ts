import developerProductsClient from '@modules/clients/developerProducts';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { GetGiftingTradingStatusResponse } from '@rbx/clients/developerProductsApi';
import { DEFAULT_RETRIES, queryKeys } from './constants';

type Options<TData = GetGiftingTradingStatusResponse> = Omit<
  UseQueryOptions<GetGiftingTradingStatusResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour - we don't expect this to change frequently

export function useGetGiftingTradingStatus<TData = GetGiftingTradingStatusResponse>(
  universeId: number,
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: queryKeys.giftingTradingStatus(universeId),
    queryFn: ({ signal }) =>
      developerProductsClient.getGiftingTradingStatus(universeId, {
        signal,
      }),
    retry: DEFAULT_RETRIES,
    staleTime: STALE_TIME_MS,
    ...options,
  });
}

export default useGetGiftingTradingStatus;
