import { useCallback, useEffect, useRef, useState } from 'react';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import { useTextFilter } from './TextFilterContext';

/**
 * Default debounce window for text-filter API calls, in milliseconds.
 * Tuned to wait long enough that we don't fire a moderation request on
 * every keystroke (which would amplify QPS on the shared moderation
 * endpoint and surface intermediate "blocked" states for substrings the
 * user is mid-typing), while staying short enough that the confirmed
 * value catches up to the user's pause without feeling laggy.
 */
export const DEFAULT_TEXT_FILTER_DEBOUNCE_MS = 400;

export type TextFilterStatus = 'idle' | 'pending' | 'ok' | 'blocked';

export type UseTextFilterValidationOptions = {
  /**
   * Treated as the initial confirmed value: a previously-persisted value is
   * trusted as already-moderated and won't be re-checked unless the typed
   * value diverges from it. Defaults to '' (no prior confirmation).
   */
  initialConfirmedValue?: string;
  /**
   * Debounce window applied before each text-filter API call, in ms.
   * Defaults to {@link DEFAULT_TEXT_FILTER_DEBOUNCE_MS}.
   */
  debounceMs?: number;
};

export type UseTextFilterValidationResult = {
  /**
   * Last value that has been confirmed safe by text moderation. Always trails
   * the typed value until a successful, non-filtered response arrives — never
   * equals a value that is still pending or has been blocked.
   */
  confirmedValue: string;
  status: TextFilterStatus;
  /** True when the typed value has been confirmed to fail moderation. */
  isBlocked: boolean;
};

/**
 * Run an async text-moderation check on a typed string. The actual moderation
 * call is supplied by the nearest `TextFilterProvider` so callers can swap
 * implementations for tests, storybook, or alternate moderation backends.
 *
 * Strictly non-optimistic: the typed value only becomes the `confirmedValue`
 * after a successful, non-filtered response from the text-filter service.
 * While a check is in flight, or the typed value is blocked, the previous
 * confirmed value is preserved so callers can continue using it (e.g. to
 * keep rendering a chart with the prior name).
 *
 * API failures fail open (treated as 'ok') so a transient text-filter outage
 * never blocks a valid input.
 *
 * Stale-response safety: every typed-value change bumps an internal request
 * id, so a slow response for an earlier value can never overwrite the
 * confirmed value once the user has moved on.
 */
const useTextFilterValidation = (
  typedValue: string,
  options: UseTextFilterValidationOptions = {},
): UseTextFilterValidationResult => {
  const { initialConfirmedValue = '', debounceMs = DEFAULT_TEXT_FILTER_DEBOUNCE_MS } = options;

  const filterText = useTextFilter();
  // Funnel the context-supplied filter through a ref so `runFilterCheck`'s
  // identity is stable even if a caller passes a fresh function each render.
  // Without this, `useDebouncedFunction` would tear down its timer on every
  // parent re-render, dropping in-flight debounces.
  const filterTextRef = useRef(filterText);
  useEffect(() => {
    filterTextRef.current = filterText;
  }, [filterText]);

  const [confirmedValue, setConfirmedValue] = useState(initialConfirmedValue);
  const [status, setStatus] = useState<TextFilterStatus>('idle');
  const requestIdRef = useRef(0);

  const runFilterCheck = useCallback(async (text: string) => {
    // Capture the current request id without bumping it: the bump that
    // matters happens synchronously in the typedValue effect below, on every
    // change to the typed value, *before* the debounce fires. By the time we
    // get here, that bump has already invalidated any earlier in-flight
    // response; double-bumping here would just push the id forward without
    // adding any stale-detection value.
    const requestId = requestIdRef.current;
    try {
      const response = await filterTextRef.current(text);
      if (requestIdRef.current !== requestId) {
        return;
      }
      if (response.isFiltered) {
        setStatus('blocked');
      } else {
        setConfirmedValue(text);
        setStatus('ok');
      }
    } catch {
      if (requestIdRef.current !== requestId) {
        return;
      }
      // Fail open: promote the typed value as if it had passed moderation so
      // a transient API outage doesn't strand the user.
      setConfirmedValue(text);
      setStatus('ok');
    }
  }, []);

  const [debouncedRunFilterCheck, cancelDebouncedFilterCheck] = useDebouncedFunction(
    runFilterCheck,
    debounceMs,
  );

  useEffect(() => {
    const trimmed = typedValue.trim();
    if (!trimmed) {
      cancelDebouncedFilterCheck();
      // Bump the request id so any in-flight response is treated as stale.
      requestIdRef.current += 1;
      // An empty value is trivially safe; promote immediately so callers
      // don't have to wait on an API round trip to clear the prior value.
      setConfirmedValue('');
      setStatus('idle');
      return;
    }
    if (trimmed === confirmedValue.trim()) {
      // Typed value already matches the confirmed value (e.g. user reverted
      // an edit). Skip the API call.
      cancelDebouncedFilterCheck();
      requestIdRef.current += 1;
      setStatus('ok');
      return;
    }
    // Bump the request id so any in-flight response for the previously typed
    // value is dropped. This is the *only* place we bump the id during a
    // normal check: it fires synchronously on every typed-value change,
    // ahead of the debounce, so by the time `runFilterCheck` actually
    // executes it can simply snapshot the current id. Without this bump, a
    // slow response for "ab" could land after the user has typed "abc" and
    // overwrite `confirmedValue`.
    requestIdRef.current += 1;
    setStatus('pending');
    debouncedRunFilterCheck(trimmed);
  }, [typedValue, confirmedValue, debouncedRunFilterCheck, cancelDebouncedFilterCheck]);

  useEffect(
    () => () => {
      cancelDebouncedFilterCheck();
      // Bump the request id on unmount so any already-in-flight `filterText`
      // promise that resolves after unmount is treated as stale and skips
      // the `setConfirmedValue` / `setStatus` calls. Keeps the
      // "every check has been invalidated" invariant uniform across both
      // typed-value transitions and unmount.
      requestIdRef.current += 1;
    },
    [cancelDebouncedFilterCheck],
  );

  return {
    confirmedValue,
    status,
    isBlocked: status === 'blocked',
  };
};

export default useTextFilterValidation;
