/**
 * Path prefixes where search and history tracking should be disabled.
 * These sections have their own navigation and don't integrate with
 * the Creator Hub search experience.
 */
const SEARCH_DISABLED_PATHS = ['/talent', '/store', '/advertise'];

export function isSearchDisabledPage(): boolean {
  if (typeof window === 'undefined') return false;
  const { pathname } = window.location;
  return SEARCH_DISABLED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default isSearchDisabledPage;
