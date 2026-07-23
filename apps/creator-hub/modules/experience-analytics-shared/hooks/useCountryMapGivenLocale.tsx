import { useEffect, useMemo, useState } from 'react';
import { toRobloxLocale, Locale } from '@rbx/intl';
import type { CountryRegionsRequest } from '@modules/clients/countryRegions';
import countryRegionsClient from '@modules/clients/countryRegions';
import { logCountryMapRetrievalFailure } from '../logging/analyticsKnownErrorLoggers';

function useCountryMapGivenLocale(givenLocale: Locale | null): Map<string, string> {
  const [countryNamesMap, setCountryNamesMap] = useState<Map<string, string>>(() => new Map());
  const locale = toRobloxLocale(givenLocale ?? Locale.English);
  const getCountryRegionsRequest: CountryRegionsRequest = useMemo(() => ({ locale }), [locale]);

  // get localized country names for charts
  useEffect(() => {
    async function getLocalizedCountryNames() {
      try {
        const countryRegions =
          await countryRegionsClient.getCountryRegions(getCountryRegionsRequest);
        if (countryRegions.countryRegionList == null) {
          return;
        }
        const newCountryMap = countryRegions.countryRegionList.reduce((map, cr) => {
          const countryCode = cr?.code;
          const countryDisplayName = cr?.displayName;

          if (typeof countryCode !== 'undefined' && typeof countryDisplayName !== 'undefined') {
            map.set(countryCode, countryDisplayName);
          }
          return map;
        }, new Map<string, string>());
        setCountryNamesMap(newCountryMap);
      } catch {
        logCountryMapRetrievalFailure({ locale });
      }
    }

    getLocalizedCountryNames();
  }, [getCountryRegionsRequest, locale]);

  return countryNamesMap;
}

export default useCountryMapGivenLocale;
