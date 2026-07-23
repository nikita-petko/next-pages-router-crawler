import countryRegionsClient, { CountryRegionsRequest } from '@modules/clients/countryRegions';
import { toRobloxLocale, Locale, useLocalization } from '@rbx/intl';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const countryRegionsKey = 'countryRegionsClient/getCountryRegions';

export const useCountryList = () => {
  const { locale } = useLocalization();
  const getCountryRegionsRequest: CountryRegionsRequest = useMemo(
    () => ({
      locale: toRobloxLocale(locale ?? Locale.English),
    }),
    [locale],
  );
  const response = useQuery({
    queryKey: [countryRegionsKey, locale],
    queryFn: async () => {
      const countryRegions = await countryRegionsClient.getCountryRegions(getCountryRegionsRequest);
      return countryRegions.countryRegionList?.map((region) => region.displayName || '');
    },
    enabled: !!locale,
  });

  const countries = response.data || [];

  return { countries, ...response };
};
export default useCountryList;
