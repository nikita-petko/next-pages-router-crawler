import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMonetizationFlags } from '@modules/monetization-shared/flags/useMonetizationFlags';
import { MOCK_HARD_CODED_PRICE_SUMMARY } from '../mocks';
import type { HardCodedPriceSummary } from '../types';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, hardCodedPricesKeys } from './constants';

type UseHardCodedPricesSummaryParams = {
  universeId?: number;
};

type Options<TData = HardCodedPriceSummary> = Omit<
  UseQueryOptions<HardCodedPriceSummary, Error, TData>,
  'queryKey' | 'queryFn'
>;

export function useGetHardCodedPricesSummary<TData = HardCodedPriceSummary>(
  { universeId }: UseHardCodedPricesSummaryParams,
  options: Options<TData> = {},
) {
  // oxlint-disable typescript/no-non-null-assertion -- guaranteed with enabled
  const { mockHardCodedPrices } = useMonetizationFlags('mockHardCodedPrices');

  return useQuery({
    queryKey: hardCodedPricesKeys.summary(universeId!, { mock: mockHardCodedPrices ?? false }),
    queryFn: async () => {
      if (mockHardCodedPrices ?? false) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        return MOCK_HARD_CODED_PRICE_SUMMARY;
      }

      return priceConfigurationApi.getHardCodedPricesSummary(universeId!);
    },
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
    enabled: !!universeId && (options.enabled ?? true),
  });
}
