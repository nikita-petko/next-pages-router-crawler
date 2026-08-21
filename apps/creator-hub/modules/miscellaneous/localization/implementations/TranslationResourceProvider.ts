import type { Locale, LocaleInfo } from '@rbx/intl';
import { CdnTranslationResourceProvider, toLocaleNativeName } from '@rbx/intl';
import localeClient from '@modules/clients/locale';
import localeMapping from '../constants/localeMapping';

export default class TranslationResourceProvider extends CdnTranslationResourceProvider {
  constructor(defaultLocaleInfo: LocaleInfo, fallbackLocale?: Locale) {
    super(defaultLocaleInfo, {
      cdnDomain: process.env.buildTarget === 'luobu' ? 'roblox.com' : process.env.robloxSiteDomain,
      fallbackLocale,
      useLocalOverrides:
        process.env.NODE_ENV === 'development' && process.env.translationOverrideMode === 'local',
    });
  }

  async loadRuntimeLocaleInfo(): Promise<LocaleInfo> {
    if (process.env.buildTarget === 'luobu') {
      return this.defaultLocaleInfo;
    }

    const { generalExperience } = await localeClient.getUserLocalizationLocusSupportedLocales();
    const robloxLocale = generalExperience?.locale;

    if (typeof robloxLocale === 'undefined') {
      return this.defaultLocaleInfo;
    }

    if (robloxLocale in localeMapping) {
      const locale = localeMapping[robloxLocale];
      return {
        locale,
        nativeName: toLocaleNativeName(locale),
      };
    }

    console.warn(`Unexpected locale ${robloxLocale} received, fallback to default locale`);
    return this.defaultLocaleInfo;
  }
}
