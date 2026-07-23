import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { GetGiftingTradingStatusResponse } from '@rbx/client-developer-products-api/v1';
import developerProductsClient from '@modules/clients/developerProducts';
import { DEFAULT_RETRIES, managedPricingKeys } from './constants';

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
    queryKey: managedPricingKeys.giftingTradingStatus(universeId),
    queryFn: ({ signal }) =>
      developerProductsClient.getGiftingTradingStatus(universeId, {
        signal,
      }),
    retry: DEFAULT_RETRIES,
    staleTime: STALE_TIME_MS,
    ...options,
  });
}
