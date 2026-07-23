import { MAX_DASHBOARD_NAME_LENGTH } from '../types';
import type { DuplicateDashboardNameSuffixes } from './duplicateDashboardNameSuffixes';

/** First numbered suffix when `"Foo (copy)"` is taken — `"Foo (copy 2)"`. */
export const DUPLICATE_COPY_NUMBERED_SUFFIX_START = 2;

/**
 * Upper bound on duplicate-name disambiguation scans (matches the legacy
 * `for (i = 2; i < 1000)` loop the services used before extraction).
 */
export const MAX_DUPLICATE_NAME_SCAN_ATTEMPTS = 1000;

export function clipDashboardName(name: string): string {
  return name.length > MAX_DASHBOARD_NAME_LENGTH ? name.slice(0, MAX_DASHBOARD_NAME_LENGTH) : name;
}

function truncateBaseForSuffix(baseName: string, suffix: string): string {
  const maxBaseLength = MAX_DASHBOARD_NAME_LENGTH - suffix.length;
  if (maxBaseLength <= 0) {
    return '';
  }
  return baseName.length > maxBaseLength ? baseName.slice(0, maxBaseLength) : baseName;
}

/**
 * Pick the smallest positive integer `n` such that `format(n)` is not present
 * in `existing`. Shared by `suggestDefaultName` ("Dashboard #N") and the
 * service's duplicate-name disambiguator ("Foo (copy N)") so both follow the
 * exact same scan-existing-names policy and stay in lockstep when one of them
 * grows new behavior (length capping, escaping, etc.).
 *
 * Existing names are trimmed before comparison — users frequently paste names
 * with stray whitespace, and the visible representation is what should drive
 * collision detection.
 */
export function findUnusedNumberedName(
  existing: Iterable<string>,
  format: (n: number) => string,
  start = 1,
  maxAttempts = MAX_DUPLICATE_NAME_SCAN_ATTEMPTS,
): string {
  // Materialise into an array first: the source is usually `Map.values()`,
  // and `Array#forEach` is preferred over `for..of` to avoid the regenerator
  // runtime at older TS targets (project-disallowed lint rule).
  const taken = new Set<string>(Array.from(existing, (n) => n.trim()));
  let candidate = Math.max(1, start);
  let attempts = 0;
  while (taken.has(format(candidate)) && attempts < maxAttempts) {
    candidate += 1;
    attempts += 1;
  }
  return format(candidate);
}

/**
 * Compute a non-colliding duplicate dashboard name for `baseName`, clipping
 * the base (and final result) so the name never exceeds
 * `MAX_DASHBOARD_NAME_LENGTH`.
 */
export function buildDuplicateDashboardName(
  existing: Iterable<string>,
  baseName: string,
  suffixes: DuplicateDashboardNameSuffixes,
): string {
  const taken = new Set(Array.from(existing, (n) => n.trim()));
  const spacedFirstSuffix = ` ${suffixes.first}`;
  const firstCandidate = `${truncateBaseForSuffix(baseName, spacedFirstSuffix)}${spacedFirstSuffix}`;
  if (!taken.has(firstCandidate)) {
    return firstCandidate;
  }
  return clipDashboardName(
    findUnusedNumberedName(
      existing,
      (n) => {
        const spacedSuffix = ` ${suffixes.numbered(n)}`;
        return `${truncateBaseForSuffix(baseName, spacedSuffix)}${spacedSuffix}`;
      },
      DUPLICATE_COPY_NUMBERED_SUFFIX_START,
      MAX_DUPLICATE_NAME_SCAN_ATTEMPTS,
    ),
  );
}

/**
 * Compute the next `"Dashboard #N"` name for a universe.
 *
 * The algorithm is intentionally forgiving: it scans all existing names (user
 * may have renamed `"Dashboard #3"` to `"My dashboard"`) and picks the smallest
 * positive integer `N` such that `"Dashboard #N"` is not already in use.
 *
 * This gives us a stable UX for users who never rename while still avoiding
 * surprise collisions with an already-renamed doc.
 */
export function suggestDefaultName(existingNames: Iterable<string>): string {
  const proposed = findUnusedNumberedName(existingNames, (n) => `Dashboard #${n}`);
  return clipDashboardName(proposed);
}
