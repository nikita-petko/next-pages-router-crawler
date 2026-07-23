import type { ResponseError } from '@modules/clients/utils/tryParseResponseError';

type Translate = (key: string, args?: Record<string, string>) => string;

interface CooldownFieldData {
  nextAllowedDate: string;
  cooldownDays?: number;
}

function isCooldownFieldData(value: unknown): value is CooldownFieldData {
  return (
    value != null &&
    typeof value === 'object' &&
    'nextAllowedDate' in value &&
    typeof (value as Record<string, unknown>).nextAllowedDate === 'string'
  );
}

/**
 * Resolve the user-visible message for a `PriceChangeTooSoon` error from develop-api with a
 * 3-tier fallback so we degrade gracefully if any layer (PSG → web-platform → develop-api) is
 * rolled back or doesn't yet emit structured `fieldData`.
 *
 *   1. Structured `fieldData.nextAllowedDate` (yyyy-MM-dd) + `fieldData.cooldownDays` →
 *      localized via Intl.DateTimeFormat and interpolated into `Error.PriceChangeTooSoon`.
 *   2. Server-provided `userFacingMessage` (English, includes the date as text).
 *   3. Generic `Error.PriceChangeTooSoonNoDate` translation (no date).
 */
export default function getPriceChangeTooSoonMessage(
  err: ResponseError,
  locale: string,
  translate: Translate,
): string {
  if (isCooldownFieldData(err.fieldData)) {
    const parsed = new Date(`${err.fieldData.nextAllowedDate}T00:00:00Z`);
    if (!Number.isNaN(parsed.getTime())) {
      const formatted = new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(parsed);
      const days = String(err.fieldData.cooldownDays ?? 60);
      return translate('Error.PriceChangeTooSoon', { date: formatted, days });
    }
  }
  if (err.userFacingMessage) {
    return err.userFacingMessage;
  }
  return translate('Error.PriceChangeTooSoonNoDate');
}
