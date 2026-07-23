import { shiftUtcToLocal } from './timezone';

/**
 * Format a start/end date pair as "MMM d, yyyy - MMM d, yyyy" using the
 * caller-supplied locale (falls back to the runtime default locale). Dates are
 * treated as UTC and shifted to display the correct calendar day.
 */
export const formatDateRange = (
  startDate: Date,
  endDate: Date,
  options?: { locale?: string },
): string => {
  const format = new Intl.DateTimeFormat(options?.locale, { dateStyle: 'medium' });
  return `${format.format(shiftUtcToLocal(startDate))} - ${format.format(shiftUtcToLocal(endDate))}`;
};
