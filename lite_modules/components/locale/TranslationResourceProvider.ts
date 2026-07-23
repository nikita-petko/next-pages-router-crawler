import {
  Locale,
  type LocaleInfo,
  toLocaleNativeName,
  toRobloxLocaleCode,
  TranslationResource,
  TranslationResourceProviderBase,
} from '@rbx/intl';
import { addBreadcrumb, captureMessage } from '@sentry/nextjs';

import localeClient from '@clients/locale';
import { EnvEnum, GetCurrentEnv } from '@utils/env';
import { GetSitetestBaseUrl } from '@utils/url';

export const failedNamespaces = new Set<string>();

// In production, the build artifact only contains en-US (see
// .github/actions/translations/action.yml). Other locales are served exclusively from the
// translations CDN; if it's unavailable, we degrade to English so the app stays usable.
const FALLBACK_LOCALE = Locale.English;

// Sample rate for the per-session CDN-fallback Sentry event. The dominant failure mode
// is client-side noise (mobile webview cancellations, ad-blockers, page bounces) that
// the app already recovers from via the bundled English fallback, so we only need a
// trickle of events to keep the trend visible. Tune down further if Sentry volume
// remains noisy after deploy.
const FALLBACK_SAMPLE_RATE = 0.1;

// Tracks whether the current session has already emitted a Sentry event for a CDN
// fallback. We collapse all per-namespace + per-locale fallbacks into at most one
// captured event per session; subsequent ones still leave breadcrumbs so any later
// Sentry error in the session inherits the full per-namespace context.
export const sessionFallbackState = { reported: false };

const flattenCdnResponse = (
  cdnResponse: Record<string, { localizedString?: string | null } | null | undefined>,
): TranslationResource =>
  // Default missing/null localizedString to `null` so an untranslated key never
  // surfaces as `undefined` to the rest of @rbx/intl, while still being
  // distinguishable from an explicitly empty translation.
  Object.fromEntries(
    Object.entries(cdnResponse).map(([key, value]) => [key, value?.localizedString ?? null]),
  );

const fetchFromCdn = async (namespace: string, locale: Locale): Promise<TranslationResource> => {
  const url = `https://translations-cdn.${GetSitetestBaseUrl()}/10/latest/${toRobloxLocaleCode(locale)}/${namespace}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CDN responded with status ${res.status}`);
  }
  // CDN response shape: { key: { localizedString: string } }. Flatten to { key: string }
  // so the rest of @rbx/intl sees the same TranslationResource shape as the legacy path.
  const cdnResponse = (await res.json()) as Record<
    string,
    { localizedString?: string | null } | null | undefined
  >;
  return flattenCdnResponse(cdnResponse);
};

const fetchLocalOverrides = async (
  namespace: string,
  locale: Locale,
): Promise<TranslationResource> => {
  try {
    const url = `${process.env.localePathPrefix}/${locale}/${namespace}.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return {};
    }
    return (await res.json()) as TranslationResource;
  } catch {
    return {};
  }
};

const fetchBundledFallback = async (namespace: string): Promise<TranslationResource> => {
  const url = `${process.env.localePathPrefix}/${FALLBACK_LOCALE}/${namespace}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bundled fallback responded with status ${res.status}`);
  }
  return (await res.json()) as TranslationResource;
};

const reportCdnFallback = (namespace: string, locale: Locale, reason: string): void => {
  // Always leave a breadcrumb so any later Sentry error in the same session inherits
  // the full per-namespace + per-locale + reason context, even when we drop the
  // captured event below.
  addBreadcrumb({
    category: 'translations.cdn',
    data: { locale, namespace, reason },
    level: 'warning',
    message: 'Translations CDN fallback to bundled English',
  });

  // Cap to one captured event per session so a single page load with N namespaces
  // failing can't fan out to N Sentry events.
  if (sessionFallbackState.reported) {
    return;
  }
  sessionFallbackState.reported = true;

  // Sample so a sustained CDN outage / widespread network noise doesn't burn the
  // event quota. We still see a clear spike during real outages because volume
  // is high enough that 10% of impacted sessions is plenty of signal.
  if (Math.random() >= FALLBACK_SAMPLE_RATE) {
    return;
  }

  // Keep the message fixed so Sentry groups every fallback under one issue. The namespace
  // and locale live in `extra` for per-event detail.
  captureMessage('Translations CDN fallback to bundled English', {
    extra: { locale, namespace, reason },
    level: 'warning',
  });
};

const localeMapping: Record<string, Locale> = {
  de_de: Locale.German,
  en_us: Locale.English,
  es_es: Locale.Spanish,
  fr_fr: Locale.French,
  hi_in: Locale.Hindi,
  id_id: Locale.Indonesian,
  it_it: Locale.Italian,
  ja_jp: Locale.Japanese,
  ko_kr: Locale.Korean,
  pl_pl: Locale.Polish,
  pt_br: Locale.BrazilPortuguese,
  ru_ru: Locale.Russian,
  th_th: Locale.Thai,
  vi_vn: Locale.Vietnamese,
  zh_cn: Locale.SimplifiedChinese,
  zh_tw: Locale.TraditionalChinese,
};

export default class TranslationResourceProvider extends TranslationResourceProviderBase {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor -- the inherited constructor is protected
  constructor(defaultLocaleInfo: LocaleInfo, fallbackLocale?: Locale) {
    super(defaultLocaleInfo, fallbackLocale);
  }

  async loadRuntimeLocaleInfo(): Promise<LocaleInfo> {
    if (process.env.buildTarget === 'luobu') {
      return this.defaultLocaleInfo;
    }
    try {
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
    } catch (error) {
      // eslint-disable-next-line no-console -- intended logging
      console.warn(`Unexpected error ${error} received, fallback to default locale`);
    }
    return this.defaultLocaleInfo;
  }

  // eslint-disable-next-line class-methods-use-this -- concrete implementation for fetching translation resources
  protected async fetchTranslationResource(
    namespace: string,
    locale: Locale,
  ): Promise<TranslationResource> {
    // Use GetCurrentEnv() so this matches the source of truth used by GetSitetestBaseUrl()
    // (factors in BUILD_ENV and IsLocalhostAndMockProd in addition to NEXT_PUBLIC_TARGET_ENV).
    // Both prod and non-prod fetch from the Roblox translations CDN at runtime; prod
    // additionally falls back to the build-time bundled English JSON (en-US only) on any
    // CDN failure so the app stays usable when the CDN is down or unreachable. Non-prod
    // skips the fallback so contributors notice CDN/sync issues immediately.
    const isProduction = GetCurrentEnv() === EnvEnum.PRODUCTION;

    try {
      const cdnResult = await fetchFromCdn(namespace, locale);

      if (process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEV_TOOLS === 'true') {
        const overrides = await fetchLocalOverrides(namespace, locale);
        return { ...cdnResult, ...overrides };
      }

      return cdnResult;
    } catch (error) {
      if (!isProduction) {
        failedNamespaces.add(namespace);
        return {};
      }
      reportCdnFallback(
        namespace,
        locale,
        error instanceof Error ? error.message : 'unknown error',
      );
    }

    try {
      return await fetchBundledFallback(namespace);
    } catch {
      failedNamespaces.add(namespace);
      return {};
    }
  }
}
