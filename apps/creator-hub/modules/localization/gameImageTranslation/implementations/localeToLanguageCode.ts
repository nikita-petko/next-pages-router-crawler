/**
 * The image `/asset-entries` endpoint keys each translation by a *locale* code (e.g. `de_de`), while
 * the active translation target is a *language* code (e.g. `de`, `zh-hans`). To resolve a translated
 * image by language, map the locale to its language code.
 *
 * Locales are `<language>_<region>` joined by an underscore, so the language is the part before the
 * underscore — except Chinese variants, whose language codes are hyphenated script tags and can't be
 * derived by splitting.
 */
const localeToLanguageCodeOverrides: Record<string, string> = {
  zh_cn: 'zh-hans',
  zh_tw: 'zh-hant',
};

export default function localeToLanguageCode(locale: string): string {
  const normalized = locale.trim().toLowerCase();
  return localeToLanguageCodeOverrides[normalized] ?? normalized.split('_')[0];
}
