import { z } from 'zod';
import type Locale from '../enums/Locale';
import type LocaleInfo from '../interfaces/LocaleInfo';
import type TranslationResource from '../interfaces/TranslationResource';
import { toRobloxLocaleCode } from '../utils/localeUtils';
import TranslationResourceProviderBase from './TranslationResourceProviderBase';

const cdnResponseSchema = z.record(
  z.string(),
  z
    .object({
      localizedString: z.string(),
    })
    .nullable()
    .catch(null),
);

const localOverrideReponse = z.record(z.string(), z.string().nullable().catch(null));

const DEFAULT_CDN_DOMAIN = 'roblox.com';
const DEFAULT_CONSUMER_ID = 10;
const DEFAULT_LOCAL_OVERRIDES_PATH = '/locales';

export type CdnTranslationResourceProviderOptions = {
  cdnDomain?: string;
  consumerId?: number;
  fallbackLocale?: Locale;
  localOverridesPath?: string;
  useLocalOverrides?: boolean;
};

export default class CdnTranslationResourceProvider extends TranslationResourceProviderBase {
  private readonly cdnDomain: string;

  private readonly consumerId: number;

  private readonly runtimeLocaleInfoLoader?: () => Promise<LocaleInfo>;

  private readonly localOverridesPath: string;

  private readonly useLocalOverrides: boolean;

  constructor(
    defaultLocaleInfo: LocaleInfo,
    {
      cdnDomain = DEFAULT_CDN_DOMAIN,
      consumerId = DEFAULT_CONSUMER_ID,
      fallbackLocale,
      localOverridesPath = DEFAULT_LOCAL_OVERRIDES_PATH,
      useLocalOverrides = false,
    }: CdnTranslationResourceProviderOptions = {},
  ) {
    super(defaultLocaleInfo, fallbackLocale);
    this.cdnDomain = cdnDomain;
    this.consumerId = consumerId;
    this.localOverridesPath = localOverridesPath;
    this.useLocalOverrides = useLocalOverrides;
  }

  loadRuntimeLocaleInfo(): Promise<LocaleInfo> {
    return this.runtimeLocaleInfoLoader?.() ?? Promise.resolve(this.defaultLocaleInfo);
  }

  protected async fetchTranslationResource(
    namespace: string,
    locale: Locale,
  ): Promise<TranslationResource> {
    const cdnLocale = toRobloxLocaleCode(locale);
    const url = `https://translations-cdn.${this.cdnDomain}/${this.consumerId}/latest/${cdnLocale}/${namespace}.json`;

    const cdnResponse = cdnResponseSchema.parse(
      await fetch(url).then((response) => response.json()),
    );

    const cdnResult = Object.fromEntries(
      Object.entries(cdnResponse).map(([key, value]) => [key, value?.localizedString ?? null]),
    );

    if (!this.useLocalOverrides) {
      return cdnResult;
    }

    const localOverrides = await this.loadLocalOverrides(namespace, locale);
    return { ...cdnResult, ...localOverrides };
  }

  private async loadLocalOverrides(
    namespace: string,
    locale: Locale,
  ): Promise<TranslationResource> {
    try {
      const response = await fetch(`${this.localOverridesPath}/${locale}/${namespace}.json`);
      if (!response.ok) {
        return {};
      }

      const localOverrides = localOverrideReponse.parse(await response.json());
      return localOverrides;
    } catch {
      return {};
    }
  }
}
