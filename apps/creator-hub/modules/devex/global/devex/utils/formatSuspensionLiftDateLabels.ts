import { getFormattedDate } from '@rbx/core';
import { getSuspensionDurationDays } from './formatInterventionCountdown';

type TranslateFn = (key: string, params?: Record<string, string>) => string;

/**
 * Localized relative duration for suspension body copy (e.g. "6 days").
 * Uses CreatorDashboard.DevEx duration labels, matching the not-approved countdown pattern.
 */
export function formatSuspensionLiftDateRelativeLabel(
  endDate: Date,
  translate: TranslateFn,
): string {
  const days = getSuspensionDurationDays(endDate);

  if (days === 1) {
    return translate('Label.Duration.OneDay');
  }

  return translate('Label.Duration.Days', { number: String(days) });
}

/** Locale-formatted absolute lift date for suspension body copy. */
export function formatSuspensionLiftDateFormattedLabel(endDate: Date): string {
  return getFormattedDate(endDate);
}
