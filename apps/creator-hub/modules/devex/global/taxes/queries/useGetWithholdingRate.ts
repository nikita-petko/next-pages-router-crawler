/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import {
  getWithholdingRate,
  PaymentType,
  type GetWithholdingRateResponse,
} from '@modules/clients/creatorTaxApi';

type Options<TData = GetWithholdingRateResponse> = Omit<
  UseQueryOptions<GetWithholdingRateResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

export const getWithholdingRateQueryKey = (paymentType: PaymentType) =>
  ['devex', 'withholdingRate', paymentType] as const;

export function useGetWithholdingRate<TData = GetWithholdingRateResponse>(
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: getWithholdingRateQueryKey(PaymentType.Royalty),
    queryFn: () => getWithholdingRate(PaymentType.Royalty),
    retry: 2,
    retryDelay: 0,
    ...options,
  });
}
