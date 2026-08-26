/**
 * Locale-aware formatters for the custom dashboards manage table.
 */

/**
 * Formats a `CustomDashboardDocument.updatedAt` ISO timestamp for the
 * "Last modified" column. The Figma design renders dates as
 * "Nov 25 21:52" — a short month + day + 24-hour time, single line.
 *
 * Locale-aware via `Intl.DateTimeFormat`. We intentionally omit the year —
 * the column is narrow and very-old rows are rare under the per-universe cap.
 */
export function formatLastModifiedDate(isoTimestamp: string, locale?: string): string {
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(date);
}
