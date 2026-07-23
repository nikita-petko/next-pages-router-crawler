/**
 * Per-universe cache of "does this experience have any custom events in the
 * last 90 days?" — populated by the dedicated custom-events page and by the
 * Explore-mode custom-event controls when their dimension request resolves.
 *
 * Two consumers read this signal:
 *   1. Navigation render time, to decide whether to surface a NUX tooltip on
 *      the Explore-mode left-rail entry pointing creators with existing
 *      custom events at the new visualization.
 *   2. Explore mode at mount time, to decide whether to default the source
 *      picker to "Custom Events" (and pre-focus the event-name selector) for
 *      experiences that almost certainly want it.
 *
 * A short TTL keeps the cache from going stale forever — once a creator
 * stops firing custom events the signal naturally falls back to "unknown"
 * within a week, and the manual source picker / chip continue to work
 * unchanged in the meantime.
 */

const KEY_PREFIX = 'exploreModeHasCustomEvents';

/**
 * Refresh the cached signal at most once a week. Worst-case staleness for a
 * brand-new user who fires their first custom event is ~7 days before the
 * NUX tooltip can appear or Explore auto-defaults to Custom Events; the chip
 * itself and the manual source picker are unaffected.
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StoredHasCustomEvents = {
  hasCustomEvents: boolean;
  storedAtMs: number;
};

const buildKey = (universeId: number | string): string => `${KEY_PREFIX}-${universeId}`;

const isStoredHasCustomEvents = (value: unknown): value is StoredHasCustomEvents => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return (
    'hasCustomEvents' in value &&
    typeof value.hasCustomEvents === 'boolean' &&
    'storedAtMs' in value &&
    typeof value.storedAtMs === 'number'
  );
};

export const getCachedHasCustomEvents = (
  universeId: number | string,
  nowMs: number = Date.now(),
): boolean | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(buildKey(universeId));
    if (raw == null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredHasCustomEvents(parsed)) {
      return null;
    }
    if (nowMs - parsed.storedAtMs > TTL_MS) {
      return null;
    }
    return parsed.hasCustomEvents;
  } catch {
    return null;
  }
};

export const setCachedHasCustomEvents = (
  universeId: number | string,
  hasCustomEvents: boolean,
  nowMs: number = Date.now(),
): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const value: StoredHasCustomEvents = { hasCustomEvents, storedAtMs: nowMs };
    window.localStorage.setItem(buildKey(universeId), JSON.stringify(value));
  } catch {
    // Quota-exceeded / privacy mode — silently ignore.
  }
};

// Exposed for tests; not part of the public module surface.
export const testConstants = { KEY_PREFIX, TTL_MS, buildKey } as const;
