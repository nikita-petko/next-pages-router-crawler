/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from './constants';
import { MOCK_HARD_CODED_PRICE_SUMMARY } from '../hard-coded-prices/mocks';
import { HardCodedPriceSummary } from '../hard-coded-prices/types';

export type UseHardCodedPricesSummaryParams = {
  universeId?: number;
};

type Options<TData = HardCodedPriceSummary> = Omit<
  UseQueryOptions<HardCodedPriceSummary, Error, TData>,
  'queryKey' | 'queryFn'
>;

// Mocking this for now
export function useGetHardCodedPricesSummary(
  { universeId }: UseHardCodedPricesSummaryParams,
  options: Options = {},
) {
  return useQuery({
    queryKey: queryKeys.hardCodedPricesSummary(universeId!),
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return MOCK_HARD_CODED_PRICE_SUMMARY;
    },
    ...options,
    enabled: !!universeId && (options.enabled ?? true),
  });
}
