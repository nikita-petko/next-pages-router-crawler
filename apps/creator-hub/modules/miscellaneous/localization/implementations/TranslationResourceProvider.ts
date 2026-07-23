import type { TranslationResource } from '@rbx/intl';
import {
  type Locale,
  type LocaleInfo,
  TranslationResourceProviderBase,
  toLocaleNativeName,
  toRobloxLocaleCode,
} from '@rbx/intl';
import localeClient from '@modules/clients/locale';
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

    console.warn(`Unexpected locale ${robloxLocale} received, fallback to default locale`);
    return this.defaultLocaleInfo;
  }

  protected async fetchTranslationResource(
    namespace: string,
    locale: Locale,
  ): Promise<TranslationResource> {
    const cdnLocale = toRobloxLocaleCode(locale); // 'en-US' → 'en_us'
    const cdnDomain =
      process.env.buildTarget === 'luobu' ? 'roblox.com' : process.env.robloxSiteDomain;
    const url = `https://translations-cdn.${cdnDomain}/10/latest/${cdnLocale}/${namespace}.json`; // 10 is BaristaFrontend consumer enum value

    // CDN contains { "key": { "localizedString": "value" } } and { "key": null }
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion -- CDN response shape is defined by the translations pipeline
    const cdnResponse = (await fetch(url).then((res) => res.json())) as Record<
      string,
      { localizedString: string }
    >;

    const cdnResult = Object.fromEntries(
      Object.entries(cdnResponse).map(([key, value]) => [key, value?.localizedString ?? null]),
    );

    // local overrides are opt-in via `pnpm dev:override:translation` (sets TRANSLATION_OVERRIDE_MODE=local)
    if (process.env.NODE_ENV === 'development' && process.env.translationOverrideMode === 'local') {
      const localOverrides = await this.loadLocalOverrides(namespace, locale);
      return { ...cdnResult, ...localOverrides };
    }

    return cdnResult;
  }

  // local overrides are opt-in via `pnpm dev:override:translation` (sets TRANSLATION_OVERRIDE_MODE=local)
  private async loadLocalOverrides(
    namespace: string,
    locale: Locale,
  ): Promise<TranslationResource> {
    try {
      const response = await fetch(`/locales/${locale}/${namespace}.json`);
      if (!response.ok) {
        return {};
      }

      // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-type-assertion
      const localOverrides = (await response.json()) as TranslationResource;
      if (Object.keys(localOverrides).length === 0) {
        return {};
      }

      return localOverrides;
    } catch {
      return {};
    }
  }
}
