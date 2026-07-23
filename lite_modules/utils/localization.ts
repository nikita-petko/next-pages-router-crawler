import { RobloxLocaleApiUserLocalizationLocusLocalesResponse } from '@rbx/client-locale/v1';

import { ROBLOX_ACCOUNT_COUNTRIES } from '@utils/location';

type LocalSurfaceKeys = keyof Omit<
  RobloxLocaleApiUserLocalizationLocusLocalesResponse,
  'showRobloxTranslations'
>;
const LOCALE_SURFACE_KEYS = ['generalExperience', 'signupAndLogin', 'ugc'] as LocalSurfaceKeys[];

const getCountryObjFromLocale = (locale?: string) => {
  const delimiter = locale?.includes('-') ? '-' : '_';
  if (locale && locale.includes(delimiter)) {
    const parts = locale.split(delimiter);
    const abbreviation = parts[parts.length - 1].toUpperCase(); // Ensure uppercase for country codes
    return ROBLOX_ACCOUNT_COUNTRIES.find((country) => country.value === abbreviation);
  }
  return null;
};

const getPreferredLocale = (
  supportedLocales?: RobloxLocaleApiUserLocalizationLocusLocalesResponse,
) => {
  // Use user's saved Roblox locale preferences before falling back to browser locale
  if (supportedLocales) {
    const preferredLocaleSurfaceKey = LOCALE_SURFACE_KEYS.find((localeSurfaceKey) => {
      const locale = supportedLocales[localeSurfaceKey]?.locale;
      const countryObj = getCountryObjFromLocale(locale);
      return Boolean(countryObj);
    });
    if (preferredLocaleSurfaceKey) {
      return supportedLocales[preferredLocaleSurfaceKey]?.locale;
    }
  }

  // Fallback to browser locale settings

  // navigator.languages is an array, e.g., ['en-US', 'en', 'fr-CA']
  // It's the most accurate reflection of user's browser language settings.
  const preferredLocales = navigator?.languages;

  // Check all locales for a matching country object
  return preferredLocales?.find((locale) => Boolean(getCountryObjFromLocale(locale)));
};

export const GetDefaultCountryValue = (
  supportedLocales?: RobloxLocaleApiUserLocalizationLocusLocalesResponse,
) => {
  const matchedLocale = getPreferredLocale(supportedLocales);

  let countryObj: { title: string; value: string } | undefined | null;
  if (matchedLocale) {
    countryObj = getCountryObjFromLocale(matchedLocale);
  }
  return countryObj ?? { title: '', value: '' };
};
