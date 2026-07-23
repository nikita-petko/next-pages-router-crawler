import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { Locale } from '@rbx/intl';
import { useLocalization } from '@rbx/intl';
import priceConfigurationApi, {
  type RegionalPricingPreviewProductType,
} from '@modules/clients/priceConfigurationApi';
import type { RegionalPrice } from '../types';
import { regionalPricesQueryKey, staleTimeMs } from './constants';

export type RegionalPriceProductType = RegionalPricingPreviewProductType;

type UseGetRegionalPricingPreviewParams = {
  universeId: number;
  productType: RegionalPricingPreviewProductType;
  price: number;
};

type Options<TData = RegionalPrice[]> = Omit<
  UseQueryOptions<RegionalPrice[], Error, TData>,
  'queryKey' | 'queryFn'
>;

export const getRegionalPricingPreviewKey = (
  universeId: number,
  productType: RegionalPricingPreviewProductType,
  price?: number,
  locale?: Locale,
) => {
  if (!price && !locale) {
    return [regionalPricesQueryKey, universeId, productType] as const;
  }

  return [regionalPricesQueryKey, universeId, productType, { price, locale }] as const;
};

export function useGetRegionalPricingPreview<TData = RegionalPrice[]>(
  { universeId, productType, price }: UseGetRegionalPricingPreviewParams,
  options: Options<TData> = {},
) {
  const locale = useLocalization().locale ?? undefined;

  return useQuery({
    queryKey: getRegionalPricingPreviewKey(universeId, productType, price, locale),
    queryFn: async () => {
      const response = await priceConfigurationApi.getRegionalPricingPreview(
        universeId,
        productType,
        price,
      );

      const regionNames = new Intl.DisplayNames(locale, { type: 'region', fallback: 'code' });

      return response.regionalPrices
        .map(({ countryISO2Code, price: regionalPrice }) => ({
          countryCode: countryISO2Code.toUpperCase(),
          // oxlint-disable-next-line typescript/no-non-null-assertion -- country guaranteed to have a name
          country: regionNames.of(countryISO2Code.toUpperCase())!,
          price: regionalPrice,
        }))
        .sort((a, b) => a.country.localeCompare(b.country));
    },
    staleTime: staleTimeMs,
    ...options,
    enabled: universeId > 0 && price > 0 && (options.enabled ?? true),
  });
}
