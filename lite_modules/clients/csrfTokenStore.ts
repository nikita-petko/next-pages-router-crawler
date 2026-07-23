/**
 * Shared CSRF token store for all WACAM clients.
 *
 * Two independent CSRF systems coexist in this app:
 *   1. `@rbx/clients-core`'s built-in `CSRFMiddleware` (used by every
 *      `Configuration`-based client), which caches the token in module scope
 *      and persists it to `localStorage['x-csrf-token']`.
 *   2. The axios-based `BaseClient` (`lite_modules/clients/base.ts`), which
 *      caches the token per-instance.
 *
 * Without coordination, each system independently incurs a 403→retry on its
 * first mutating request, and parallel requests within a system race to
 * trigger redundant 403s. This module unifies both systems behind a single
 * source of truth backed by the same `localStorage` key clients-core already
 * uses, so any token harvested by any code path is immediately visible to
 * every other code path.
 *
 * To eliminate the first-request 403 entirely, `primeCsrfToken` calls our
 * Next.js API route at `/api/csrf-prime`, which performs the upstream
 * priming PATCH server-side. The 403 happens on the server (invisible to
 * the user); the browser only sees a clean GET → 200.
 */
export const CSRF_TOKEN_HEADER = 'x-csrf-token';

// Must match `@rbx/clients-core`'s `CSRFMiddleware` storage key so that
// tokens are shared bidirectionally between this store and clients-core.
const STORAGE_KEY = 'x-csrf-token';

// Internal Next.js API route that performs the upstream priming PATCH
// server-side and returns the harvested token as JSON. The 403 happens on
// the server, never in the browser. See `pages/api/csrf-prime.ts`.
const PRIMING_URL = '/api/csrf-prime';

let inMemoryToken: string | null = null;
let primingPromise: Promise<string | null> | null = null;

const readFromStorage = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeToStorage = (token: string): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // SSR / private-mode / quota — fall through; in-memory copy is still live.
  }
};

export const getCsrfToken = (): string | null => {
  if (inMemoryToken) {
    return inMemoryToken;
  }
  inMemoryToken = readFromStorage();
  return inMemoryToken;
};

/**
 * Writes a CSRF token to the shared store.
 *
 * Callers can pass `null`/`undefined`/`''` defensively (e.g. when reading a
 * possibly-missing response header) and this function will treat that as a
 * no-op rather than wiping a valid cached token. Use {@link clearCsrfToken}
 * for explicit invalidation (e.g. logout, account switch).
 */
export const setCsrfToken = (token: string | null | undefined): void => {
  if (!token) {
    return;
  }
  inMemoryToken = token;
  writeToStorage(token);
};

/**
 * Explicitly clears the CSRF token from both the in-memory cache and
 * `localStorage`. Use this from logout / account-switch flows so the next
 * mutating request re-primes with a fresh token tied to the new session.
 */
export const clearCsrfToken = (): void => {
  // TODO: when this is wired into logout/account-switch, also invalidate any
  // in-flight `primingPromise` so its resolved token (tied to the old
  // session) can't race back in via setCsrfToken.
  inMemoryToken = null;
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // SSR / private-mode / quota — in-memory copy is already cleared, which
    // is the security-critical bit; persistence is best-effort.
  }
};

/**
 * Fires a single priming request to harvest the CSRF token. Concurrent calls
 * share the same in-flight Promise so we never fire more than one priming
 * request per session. If a token is already cached, resolves immediately.
 */
export const primeCsrfToken = (): Promise<string | null> => {
  const cached = getCsrfToken();
  if (cached) {
    return Promise.resolve(cached);
  }
  if (primingPromise) {
    return primingPromise;
  }

  primingPromise = (async () => {
    try {
      // GET our internal route; it relays a PATCH to apis.roblox.com
      // server-side (where the 403→token-harvest happens) and returns the
      // token as JSON. The browser only ever sees this clean 200.
      const response = await fetch(PRIMING_URL, {
        credentials: 'include',
        method: 'GET',
      });
      if (!response.ok) {
        return null;
      }
      const { token } = (await response.json()) as { token: string | null };
      if (token) {
        setCsrfToken(token);
        return token;
      }
      return null;
    } catch {
      // Best-effort priming. If it fails, the existing 403→retry paths in
      // BaseClient and clients-core's CSRFMiddleware still recover the token
      // on the next mutating request.
      return null;
    } finally {
      // Allow re-priming on the next call if this one failed; on success the
      // `getCsrfToken()` short-circuit at the top of this function prevents
      // a re-fire.
      primingPromise = null;
    }
  })();

  return primingPromise;
};

/**
 * Test-only: reset module state. The `TEST_ONLY` prefix marks this as
 * intentionally not part of the public API; production callers must not
 * import it.
 */
export const resetCsrfTokenStoreTEST_ONLY = (): void => {
  inMemoryToken = null;
  primingPromise = null;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
};
