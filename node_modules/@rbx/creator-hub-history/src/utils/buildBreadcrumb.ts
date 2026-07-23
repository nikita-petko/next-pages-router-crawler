import { TITLE_SEPARATOR } from '../config';

/**
 * Build a breadcrumb path string from segments joined by {@link TITLE_SEPARATOR}.
 * Used for the `hub:breadcrumb` meta tag on `<HubMeta>`.
 * Undefined/null/empty segments are filtered out automatically.
 * Returns `undefined` when no valid segments remain.
 *
 * @example
 * buildBreadcrumb('Settings', 'Notifications')
 * // → "Settings / Notifications"
 *
 * buildBreadcrumb('Creations', gameName, 'Overview')
 * // → "Creations / My Cool Game / Overview"
 */
export default function buildBreadcrumb(
  ...segments: (string | undefined | null)[]
): string | undefined {
  const filtered = segments.filter(Boolean) as string[];
  return filtered.length > 0 ? filtered.join(TITLE_SEPARATOR) : undefined;
}
