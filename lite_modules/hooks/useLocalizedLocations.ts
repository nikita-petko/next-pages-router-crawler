import { useLocalization } from '@rbx/intl';
import { useMemo } from 'react';

import { TranslationNamespace } from '@constants/localization';
import { RegionsAndCountriesSortedAlph } from '@constants/locationAutocomplete';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { RegionsAndLocationsFormInputObj } from '@type/locationAutocomplete';
import { getLocalizedCountryName } from '@utils/location';

const REGION_CODE_TO_KEY: Record<string, string> = {
  AFRICA: 'Region.Africa',
  All: 'Region.AllRegions',
  AllNonEU: 'Region.AllNonEU',
  ANZ: 'Region.AustraliaAndNewZealand',
  EAST_ASIA: 'Region.EastAsia',
  EASTERN_EUROPE: 'Region.EasternEurope',
  LATIN_AMERICA: 'Region.LatinAmerica',
  MIDDLE_EAST: 'Region.MiddleEast',
  ROW: 'Region.RestOfTheWorld',
  SOUTHEAST_ASIA: 'Region.SoutheastAsia',
  UAC: 'Region.USAndCanada',
  WESTERN_EUROPE: 'Region.WesternEurope',
};

const useLocalizedLocations = (): RegionsAndLocationsFormInputObj[] => {
  const { locale } = useLocalization();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);

  return useMemo(() => {
    const effectiveLocale = locale || 'en';

    const localized = RegionsAndCountriesSortedAlph.map((entry) => {
      if (entry.parentRegion || entry.superGroup) {
        const key = REGION_CODE_TO_KEY[entry.regionCode];
        return key ? { ...entry, title: translate(key) } : entry;
      }

      if (entry.countryCode) {
        return {
          ...entry,
          title: getLocalizedCountryName(entry.countryCode, effectiveLocale),
        };
      }

      return entry;
    });

    return localized;
  }, [locale, translate]);
};

export default useLocalizedLocations;
