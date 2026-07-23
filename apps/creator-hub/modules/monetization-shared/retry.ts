import { StatusCodes } from '@rbx/core';
import getResponseFromError from '@modules/clients/utils/getResponseFromError';

/** Caps how long a single rate-limited call waits before redoing. */
const RATE_LIMIT_MAX_BACKOFF_MS = 30000;
/** Jittered delay used when the server omits `Retry-After`. */
const RATE_LIMIT_BASE_DELAY_MS = 1000;

/** `true` when the error is an HTTP 429 (Too Many Requests) response. */
export const isRateLimitError = (error: unknown): boolean =>
  getResponseFromError(error)?.status === StatusCodes.TOO_MANY_REQUESTS;

/**
 * Rate-limit backoff (ms). Honors the server's `Retry-After` header (RFC 7231:
 * delta-seconds or an HTTP-date) and otherwise falls back to a jittered constant
 * delay, always capped at {@link RATE_LIMIT_MAX_BACKOFF_MS}.
 */
export const rateLimitBackoff = (error: unknown): number => {
  const retryAfter = getResponseFromError(error)?.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.min(Math.max(seconds, 0) * 1000, RATE_LIMIT_MAX_BACKOFF_MS);
    }
    const dateMs = Date.parse(retryAfter);
    if (!Number.isNaN(dateMs)) {
      return Math.min(Math.max(dateMs - Date.now(), 0), RATE_LIMIT_MAX_BACKOFF_MS);
    }
  }

  return RATE_LIMIT_BASE_DELAY_MS + Math.random() * RATE_LIMIT_BASE_DELAY_MS;
};

/**
 * Retry options loosely based on `UseMutationOptions`
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/reference/useMutation
 */
export type RetryOptions<TError = Error> = {
  retry?: number;
  retryDelay?: number | ((retryAttempt: number, error: TError) => number);
};

/**
 * Retries `fn` up to `retry` times. The delay before each retry comes from
 * `retryDelay` (a constant ms or a `(retryAttempt, error)` function); when
 * `retryDelay` is omitted it falls back to {@link rateLimitBackoff}.
 */
export async function retryAsync<T, TError = Error>(
  fn: () => Promise<T>,
  { retry = 0, retryDelay }: RetryOptions<TError> = {},
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retry > 0) {
      let delay: number;
      if (retryDelay === undefined) {
        delay = rateLimitBackoff(error);
      } else if (typeof retryDelay === 'function') {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- intended type check
        delay = retryDelay(retry, error as TError);
      } else {
        delay = retryDelay;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
      return retryAsync(fn, { retry: retry - 1, retryDelay });
    }
    throw error;
  }
}

/**
 * Retries `fn` up to `retry` times, but only when the failure is an HTTP 429:
 * it waits per the server's `Retry-After` (or a jittered constant backoff) and
 * redoes the call. Any other error propagates immediately without a retry.
 */
export async function retryWithRateLimitBackoff<T>(
  fn: () => Promise<T>,
  retry: number,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retry <= 0 || !isRateLimitError(error)) {
      throw error;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, rateLimitBackoff(error));
    });
    return retryWithRateLimitBackoff(fn, retry - 1);
  }
}
