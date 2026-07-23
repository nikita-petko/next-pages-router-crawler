import { toRobloxLocale, Locale, useLocalization } from '@rbx/intl';
import { useState, useEffect, useMemo } from 'react';
import { localeClient } from '@modules/clients';

export function useLocaleMapGivenCurrentLanguage(locale: Locale | null) {
  const [localesMap, setLocalesMap] = useState<Map<string, string>>(() => new Map());
  const [languagesMap, setLanguagesMap] = useState<Map<string, string>>(() => new Map());
  const requestedLocale: Locale = useMemo(() => {
    if (locale === Locale.SimplifiedChineseJV) {
      return Locale.SimplifiedChinese;
    }
    return locale ?? Locale.English;
  }, [locale]);

  // get localized locale display names for charts
  useEffect(() => {
    async function getLocalizedLocalesAndLanguages() {
      try {
        const locales = await localeClient.getSupportedLocalesForCreators({
          displayValueLocale: toRobloxLocale(requestedLocale),
        });
        if (locales.data == null) {
          return;
        }
        const initialMaps = {
          localesMap: new Map<string, string>(),
          languagesMap: new Map<string, string>(),
        };
        const updatedLocalesAndLanguagesMaps = locales.data.reduce((maps, loc) => {
          const currLocale = loc.locale?.locale;
          const currLanguageCode = loc.locale?.language?.languageCode;
          const localizedLanguageName = loc.locale?.language?.name;

          if (typeof localizedLanguageName !== 'undefined') {
            if (typeof currLocale !== 'undefined') {
              maps.localesMap.set(currLocale, localizedLanguageName);
            }
            if (typeof currLanguageCode !== 'undefined') {
              maps.languagesMap.set(currLanguageCode, localizedLanguageName);
            }
          }
          return maps;
        }, initialMaps);
        setLocalesMap(updatedLocalesAndLanguagesMaps.localesMap);
        setLanguagesMap(updatedLocalesAndLanguagesMaps.languagesMap);
      } catch {
        // do nothing
      }
    }
    getLocalizedLocalesAndLanguages();
  }, [locale, requestedLocale]);

  return {
    localesMap,
    languagesMap,
  };
}
function useLocaleMap() {
  const { locale } = useLocalization();
  return useLocaleMapGivenCurrentLanguage(locale);
}
export default useLocaleMap;
