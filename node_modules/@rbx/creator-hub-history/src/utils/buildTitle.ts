import { TITLE_SEPARATOR } from '../config';

/**
 * Build a page title from segments joined by {@link TITLE_SEPARATOR}.
 * Used for both `seoTitle` and `hub:title` props on `<HubMeta>`.
 * Undefined/null/empty segments are filtered out automatically.
 *
 * Segments should be ordered general → specific (breadcrumb order).
 *
 * @example
 * // seoTitle (general → specific)
 * buildTitle('Creator Hub', experienceName, 'Developer Products', 'Analytics')
 * // → "Creator Hub / My Cool Game / Developer Products / Analytics"
 *
 * // hub:title (omits site name and entity name)
 * buildTitle('Developer Products', 'Analytics')
 * // → "Developer Products / Analytics"
 */
function buildTitle(...segments: (string | undefined | null)[]): string {
  return segments.filter(Boolean).join(TITLE_SEPARATOR);
}

export default buildTitle;
