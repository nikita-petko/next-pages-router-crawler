import { Locale } from '@rbx/intl';
import { availableDocsLocales } from '@modules/creator-settings/container/preferences/LocaleConstants';

export const MOMENTS_UPLOAD_LOCALES: readonly Locale[] = availableDocsLocales;

const MOMENTS_UPLOAD_LOCALE_VALUES = new Set<string>(MOMENTS_UPLOAD_LOCALES);

export const isMomentsUploadLocale = (value: string): value is Locale =>
  MOMENTS_UPLOAD_LOCALE_VALUES.has(value);

/**
 * Prefers the runtime UI locale (Roblox account language from account info),
 * then English.
 */
export const getDefaultMomentsUploadLocale = (uiLocale: Locale | null | undefined): Locale => {
  // zh-CJV is a Roblox-internal Simplified Chinese variant; fold to zh-CN like useSupportedLocale.
  const resolvedUiLocale =
    uiLocale === Locale.SimplifiedChineseJV ? Locale.SimplifiedChinese : uiLocale;

  if (resolvedUiLocale != null && isMomentsUploadLocale(resolvedUiLocale)) {
    return resolvedUiLocale;
  }

  return Locale.English;
};

/** Backfills publish locale for drafts created before content language was persisted. */
export const resolveMomentPublishLocale = (
  moment: { locale?: Locale },
  uiLocale?: Locale | null,
): Locale => moment.locale ?? getDefaultMomentsUploadLocale(uiLocale);
