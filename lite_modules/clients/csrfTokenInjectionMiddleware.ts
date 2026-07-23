/**
 * Injected Token Strategy: a `@rbx/clients-core` `Middleware` that bridges
 * the shared `csrfTokenStore` and clients-core's built-in `CSRFMiddleware`.
 *
 * Ordering note: the `Configuration` subclass in clients-core `unshift`s its
 * framework middlewares (including `CSRFMiddleware`) onto the front of the
 * user-supplied middleware array, so the effective `pre` order is
 * `[CSRFMiddleware, csrfTokenInjectionMiddleware]`.
 *
 * - `pre`: clients-core's `CSRFMiddleware.pre` runs first. On a cold load
 *   its module-scope `currentToken` is empty, so it's a no-op and ours then
 *   injects the shared token for mutating methods. Once `CSRFMiddleware`
 *   has harvested a token from a `post` 403, its `pre` will set the header
 *   itself and ours becomes a no-op (we skip when the header is already set).
 * - `post`: if a 403 response carries an `x-csrf-token` header (the standard
 *   Roblox refresh path), writes the new value back to the shared store so
 *   that BaseClient and any other code path immediately benefit. Note that
 *   `CSRFMiddleware` only ever populates its own `currentToken` from response
 *   headers — it does not adopt the value we inject in `pre`.
 */
import type { Middleware } from '@rbx/clients-core';

import { CSRF_TOKEN_HEADER, getCsrfToken, setCsrfToken } from '@clients/csrfTokenStore';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Normalize the three shapes `HeadersInit` can take (`Headers` instance,
 * `[k, v][]` tuple array, or plain `Record<string, string>`) into a plain
 * dictionary. Object-spreading a `Headers` instance silently produces `{}`,
 * and spreading a tuple array produces numeric keys, so we must never spread
 * raw `init.headers` into the merged object literal.
 */
const headersToRecord = (headers: HeadersInit | undefined): Record<string, string> => {
  if (!headers) {
    return {};
  }
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
};

const headerHasCsrf = (headers: HeadersInit | undefined): boolean => {
  if (!headers) {
    return false;
  }
  if (headers instanceof Headers) {
    return headers.has(CSRF_TOKEN_HEADER);
  }
  if (Array.isArray(headers)) {
    return headers.some(([k]) => k.toLowerCase() === CSRF_TOKEN_HEADER);
  }
  return Object.keys(headers).some((k) => k.toLowerCase() === CSRF_TOKEN_HEADER);
};

export const csrfTokenInjectionMiddleware: Middleware = {
  post: async ({ response }) => {
    const token = response.headers.get(CSRF_TOKEN_HEADER);
    if (response.status === 403 && token) {
      setCsrfToken(token);
    }
    return response;
  },
  pre: async ({ init, url }) => {
    const method = (init.method ?? 'GET').toUpperCase();
    if (!MUTATING_METHODS.has(method)) {
      return { init, url };
    }

    const token = getCsrfToken();
    if (!token) {
      return { init, url };
    }
    if (headerHasCsrf(init.headers)) {
      return { init, url };
    }

    return {
      init: {
        ...init,
        headers: {
          ...headersToRecord(init.headers),
          [CSRF_TOKEN_HEADER]: token,
        },
      },
      url,
    };
  },
};
