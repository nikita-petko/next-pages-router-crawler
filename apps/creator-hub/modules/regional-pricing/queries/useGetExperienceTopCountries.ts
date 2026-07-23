import priceConfigurationApi from '@modules/clients/priceConfigurationApi';
import { useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useLocalization, type Locale } from '@rbx/intl';
import { experienceTopCountriesQueryKey, rootQueryKey } from './constants';

const DEFAULT_STALE_TIME_MS = 60 * 60 * 1000; // 1 hour - this can afford to be stale for a whiles

type Options<TData = string[]> = Omit<
  UseQueryOptions<string[], Error, TData>,
  'queryKey' | 'queryFn'
>;

export const getExperienceTopCountriesQueryKey = (universeId: number, locale?: Locale) =>
  [rootQueryKey, universeId, experienceTopCountriesQueryKey, locale] as const;

export function useGetExperienceTopCountries<TData = string[]>(
  { universeId }: { universeId: number },
  options: Options<TData> = {},
) {
  const locale = useLocalization().locale ?? undefined;
  const regionNames = useMemo(
    () => new Intl.DisplayNames(locale, { type: 'region', fallback: 'code' }),
    [locale],
  );

  return useQuery({
    queryKey: getExperienceTopCountriesQueryKey(universeId, locale),
    queryFn: async () => {
      const response = await priceConfigurationApi.getTopCountriesByEarnings(universeId);

      return response.countries.map((country) => regionNames.of(country.toUpperCase())!);
    },
    staleTime: DEFAULT_STALE_TIME_MS,
    ...options,
    enabled: universeId > 0 && (options.enabled ?? true),
  });
}
