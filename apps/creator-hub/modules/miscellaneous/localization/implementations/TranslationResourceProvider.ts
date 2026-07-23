import {
  type Locale,
  type LocaleInfo,
  TranslationResourceProviderBase,
  TranslationResource,
  toLocaleNativeName,
} from '@rbx/intl';
import { localeClient } from '@modules/clients';
import localeMapping from '../constants/localeMapping';

export default class TranslationResourceProvider extends TranslationResourceProviderBase {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor -- (@zwang, 08/07/24): the inherited constructor is protected
  constructor(defaultLocaleInfo: LocaleInfo, fallbackLocale?: Locale) {
    super(defaultLocaleInfo, fallbackLocale);
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
      const nativeName = toLocaleNativeName(locale);
      return {
        locale,
        nativeName,
      };
    }

    // eslint-disable-next-line no-console -- (@zwang, 08/07/24): intended logging
    console.warn(`Unexpected locale ${robloxLocale} received, fallback to default locale`);
    return this.defaultLocaleInfo;
  }

  // eslint-disable-next-line class-methods-use-this -- (@zwang, 08/07/24): concrete implementation for fetching translation resources
  protected async fetchTranslationResource(
    namespace: string,
    locale: Locale,
  ): Promise<TranslationResource> {
    const translationResource = await fetch(
      `${process.env.localePathPrefix}/${locale}/${namespace}.json`,
    ).then((res) => res.json() as Promise<TranslationResource>); // default typing does not support typed response as for today

    return translationResource;
  }
}
