import type { TSupportedLocale } from '@rbx/foundation-ui';
import { useLocalization, Locale } from '@rbx/intl';

/** Manual overrides from @rbx/intl locales to foundation DateTimePicker-supported locales */
const LOCALE_OVERRIDES_TO_SUPPORTED_LOCALE: Record<Locale, TSupportedLocale> = {
  [Locale.English]: Locale.English,
  [Locale.Spanish]: Locale.Spanish,
  [Locale.French]: Locale.French,
  [Locale.German]: Locale.German,
  [Locale.Italian]: Locale.Italian,
  [Locale.BrazilPortuguese]: Locale.BrazilPortuguese,
  [Locale.Korean]: Locale.Korean,
  [Locale.SimplifiedChinese]: Locale.SimplifiedChinese,
  [Locale.TraditionalChinese]: Locale.TraditionalChinese,
  [Locale.Japanese]: Locale.Japanese,
  [Locale.Russian]: Locale.Russian,
  [Locale.Indonesian]: Locale.Indonesian,
  [Locale.Polish]: Locale.Polish,
  [Locale.Vietnamese]: Locale.Vietnamese,
  [Locale.Turkish]: Locale.Turkish,
  [Locale.Thai]: Locale.Thai,
  [Locale.Hindi]: Locale.Hindi,

  // Manual overrides
  [Locale.SimplifiedChineseJV]: Locale.SimplifiedChinese,
  [Locale.Arabic]: 'ar-SA',
};

/**
 * Returns the current supported locale for foundation-web DateTimePicker.
 *
 * Currently `@rbx/intl` has a few locales that are not directly supported by foundation-web DateTimePicker,
 * so we need to manually override them to the supported locales.
 *
 * @param localeOverride - The locale to use, overriding the context locale. If not provided, the context locale will be used.
 */
export function useSupportedLocale(
  localeOverride?: TSupportedLocale,
): TSupportedLocale | undefined {
  const contextLocale = useLocalization().locale ?? undefined;
  if (localeOverride) {
    return localeOverride;
  }

  const locale = localeOverride ?? contextLocale;
  if (locale === undefined) {
    return undefined;
  }

  return LOCALE_OVERRIDES_TO_SUPPORTED_LOCALE[locale];
}
