/**
 * Per-universe persistence of the user's last-selected custom event name in
 * Explore mode.
 *
 * Tracked independently of the broader "last source" remembered state
 * (see `exploreModeLastSourceStorage`) so it survives source switches —
 * picking `EventA`, switching the source to `DailyActiveUsers`, and later
 * defaulting back into Custom Events still remembers `EventA` as the
 * preferred event name to pre-select when the dimension request resolves.
 *
 * Consumers are responsible for validating that the cached name is still
 * present in the freshly-loaded option list before applying it — stale
 * names (events the creator stopped firing 90+ days ago) should not be
 * forced back into the URL state.
 */

const KEY_PREFIX = 'exploreModeLastCustomEventName';

const buildKey = (universeId: number | string): string => `${KEY_PREFIX}-${universeId}`;

export const getLastSelectedCustomEventName = (universeId: number | string): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(buildKey(universeId));
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'string' || parsed.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const setLastSelectedCustomEventName = (
  universeId: number | string,
  name: string | null,
): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const key = buildKey(universeId);
    if (name === null || name.length === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(name));
  } catch {
    // Quota-exceeded / privacy mode — silently ignore; UX gracefully
    // falls back to no remembered event name.
  }
};

// Exposed for tests; not part of the public module surface.
export const testConstants = { KEY_PREFIX, buildKey } as const;
