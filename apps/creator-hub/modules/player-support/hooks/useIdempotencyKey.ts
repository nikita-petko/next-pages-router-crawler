import { useCallback, useRef } from 'react';
import {
  IDEMPOTENT_RETRY_BASE_DELAY_MS,
  IDEMPOTENT_RETRY_COUNT,
  IDEMPOTENT_RETRY_MAX_DELAY_MS,
} from '../constants/timeConstants';

/**
 * Generates a unique idempotency key. Prefers `crypto.randomUUID()` and falls back
 *  to a timestamp + random suffix for environments where it's unavailable
 * (plain HTTP, some test runners).
 */
export const createIdempotencyKey = (prefix = 'idempotency'): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export interface IdempotencyKeyController {
  /**
   * Returns the key for the current in-flight request, lazily generating one on
   * first use. Stable across retries of the same logical request so the backend
   * can dedupe a request that may have already committed server-side.
   */
  ensure: () => string;
  /**
   * Clears the key so the next logical request generates a fresh one. Call from
   * the mutation's `onSettled` (after all retries have finished).
   */
  reset: () => void;
}

/**
 * Manages a single idempotency key across the lifecycle of a mutation: stable
 * while a request (and its retries) is in flight, regenerated for each new
 * attempt.
 */
const useIdempotencyKey = (prefix?: string): IdempotencyKeyController => {
  const keyRef = useRef<string | null>(null);

  const ensure = useCallback(() => {
    keyRef.current ??= createIdempotencyKey(prefix);
    return keyRef.current;
  }, [prefix]);

  const reset = useCallback(() => {
    keyRef.current = null;
  }, []);

  return { ensure, reset };
};

/**
 * Retry policy for idempotent mutations. Safe to retry because every attempt
 * reuses the same idempotency key, so the backend dedupes requests that may
 * have already succeeded. Spread into `useMutation({ ...idempotentRetryConfig })`.
 */
export const idempotentRetryConfig = {
  retry: IDEMPOTENT_RETRY_COUNT,
  retryDelay: (attemptIndex: number): number =>
    Math.min(IDEMPOTENT_RETRY_BASE_DELAY_MS * 2 ** attemptIndex, IDEMPOTENT_RETRY_MAX_DELAY_MS),
};

export default useIdempotencyKey;
