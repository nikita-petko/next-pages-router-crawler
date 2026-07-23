/**
 * Locale-formatted date for `{lastUpdated}` in `Message.CashOutPayoutRateInfoBanner`.
 *
 * Prefers the watermark `lastProcessedTimestamp` surfaced by the `estimated-fiat` API (how fresh the
 * underlying Frost-derived balances are). Falls back to calendar yesterday when the backend value is
 * missing (e.g. watermarks disabled or the estimate failed to load), so the banner always shows a date.
 */
export function getCashOutPayoutInfoLastUpdatedLabel(
  locale: string | null | undefined,
  lastProcessedTimestamp?: Date | null,
): string {
  const resolvedLocale =
    locale !== null && locale !== undefined && locale !== '' ? locale : 'en-US';
  const formatter = new Intl.DateTimeFormat(resolvedLocale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (lastProcessedTimestamp != null && !Number.isNaN(lastProcessedTimestamp.getTime())) {
    return formatter.format(lastProcessedTimestamp);
  }

  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  return formatter.format(yesterday);
}
