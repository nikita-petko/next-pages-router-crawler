import { useLocalization } from '@rbx/intl';
import { useMemo } from 'react';

import {
  getLocalizedCountries,
  getLocalizedCountryName,
  ROBLOX_ACCOUNT_COUNTRIES,
} from '@utils/location';

const useCountries = () => {
  const { locale } = useLocalization();

  const countries = useMemo(
    () => (locale ? getLocalizedCountries(locale) : ROBLOX_ACCOUNT_COUNTRIES),
    [locale],
  );

  const getCountryByCode = useMemo(
    () => (countryCode: string) => {
      const title = locale
        ? getLocalizedCountryName(countryCode, locale)
        : (ROBLOX_ACCOUNT_COUNTRIES.find((c) => c.value === countryCode)?.title ?? countryCode);
      return { title, value: countryCode };
    },
    [locale],
  );

  return { countries, getCountryByCode };
};

export default useCountries;
