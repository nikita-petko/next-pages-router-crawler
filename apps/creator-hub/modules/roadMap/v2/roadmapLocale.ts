import { Locale } from '@rbx/intl';
import localeNameMapping from '@modules/miscellaneous/localization/constants/localeNameMapping';

// The roadmap feed is authored per locale in the CMS, which keys translations by its own locale
// codes — not the app's Discourse-style `{lang}_{region}` codes. This maps the latter (produced by
// the shared `localeNameMapping`) to the former, mirroring the backend source of truth in
// creator-updates-api's `ChangelogLanguageCodes`. A language absent here has no CMS translation, so
// it resolves to English and the server returns the source content.
const CLIENT_TO_CMS_LOCALE: Readonly<Record<string, string>> = {
  en_us: 'en-us',
  es_es: 'es',
  pt_br: 'pt-BR',
  vi_vn: 'vi',
  fr_fr: 'fr',
  ko_kr: 'ko',
  de_de: 'de',
  ja_jp: 'ja',
  it_it: 'it',
  zh_cn: 'zh-CN',
  zh_tw: 'zh-TW',
};

// The roadmap API's default; the backend serves the CMS source language for `en-us`.
const DEFAULT_ROADMAP_LOCALE = 'en-us';

/**
 * Resolves the user's active `Locale` to the CMS locale code the roadmap feed expects on
 * `GET /v1/roadmap/items?locale=`. Languages with no CMS translation fall back to English.
 */
export const getRoadmapLocale = (locale: Locale | null | undefined): string =>
  CLIENT_TO_CMS_LOCALE[localeNameMapping[locale ?? Locale.English]] ?? DEFAULT_ROADMAP_LOCALE;
