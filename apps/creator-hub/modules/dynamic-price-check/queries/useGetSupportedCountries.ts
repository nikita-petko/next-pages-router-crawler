import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { Locale, useLocalization } from '@rbx/intl';
import { queryRetry, getSupportedCountriesQueryKey } from './constants';
import COUNTRIES_FALLBACK from './countries';
import type { Country } from '../types';

type Options<TData = Country[]> = Omit<
  UseQueryOptions<Country[], Error, TData>,
  'queryKey' | 'queryFn'
>;

async function getSupportedCountries(
  locale: Intl.LocalesArgument = navigator.language,
  options: RequestInit = {},
): Promise<Country[]> {
  const regionNames = new Intl.DisplayNames(locale, {
    type: 'region',
    fallback: 'code',
  });

  let countries: string[];
  try {
    const response = await priceConfigurationApi.getSupportedCountries(options);
    countries = response.countries;
  } catch {
    countries = COUNTRIES_FALLBACK;
  }

  return countries
    .map((code) => ({
      displayName: regionNames.of(code.toUpperCase())!,
      code,
    }))
    .filter((country) => country.displayName !== undefined)
    .sort((a, b) => a.displayName.localeCompare(b.displayName)) satisfies Country[];
}

export default function useGetSupportedCountries<TData = Country[]>(options: Options<TData> = {}) {
  const locale = useLocalization().locale ?? Locale.English;

  return useQuery({
    queryKey: getSupportedCountriesQueryKey,
    queryFn: ({ signal }) => getSupportedCountries(locale, { signal }),
    retry: queryRetry,
    staleTime: Infinity,
    ...options,
  });
}
