import { useCallback, useMemo, useState } from 'react';
import type { RobloxLocaleApiCountryRegion } from '@rbx/client-locale/v1';
import { toRobloxLocale, Locale, useLocalization } from '@rbx/intl';
import type { CountryRegionsRequest } from '@modules/clients/countryRegions';
import countryRegionsClient from '@modules/clients/countryRegions';
import { useAsyncAction } from '@modules/clients/utils';

export function useCountryRegionsGivenLocale(locale: Locale | null) {
  const [countryRegionsList, setCountryRegionsList] = useState<
    RobloxLocaleApiCountryRegion[] | null
  >();

  const getCountryRegionsRequest: CountryRegionsRequest = useMemo(
    () => ({
      locale: toRobloxLocale(locale ?? Locale.English),
    }),
    [locale],
  );

  const getLocalizedCountryNames = useCallback(async () => {
    if (countryRegionsList) {
      return countryRegionsList;
    }
    const countryRegions = await countryRegionsClient.getCountryRegions(getCountryRegionsRequest);
    if (countryRegions.countryRegionList == null) {
      return [];
    }
    setCountryRegionsList(countryRegions.countryRegionList);
    return countryRegions.countryRegionList;
  }, [countryRegionsList, getCountryRegionsRequest]);

  return useAsyncAction(getLocalizedCountryNames);
}

function useCountryRegions() {
  const { locale } = useLocalization();
  return useCountryRegionsGivenLocale(locale);
}
export default useCountryRegions;
