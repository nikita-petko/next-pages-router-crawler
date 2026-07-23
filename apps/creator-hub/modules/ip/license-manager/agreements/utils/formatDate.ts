const LONG_CALENDAR_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

/**
 * Formats a calendar date with `toLocaleDateString` (long month, numeric day and year).
 * Returns an empty string for nullish or invalid values.
 */
function formatDate(date: string | Date | null | undefined, locale: string): string {
  if (date == null || date === '') {
    return '';
  }
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleDateString(locale, LONG_CALENDAR_DATE_OPTIONS);
}

export default formatDate;
