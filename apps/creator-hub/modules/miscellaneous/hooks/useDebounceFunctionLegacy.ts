import { useRef, useCallback } from 'react';

/**
 * Return the debounced input value to prevent frequently updated.
 *
 * @param value - Value to be debounced
 * @param {number} delay - Delay of the debounce in ms
 * @returns the debounced input value based on the given delay
 */
type RawFunction<TArgs extends unknown[]> = (...args: TArgs) => unknown;

const useDebounceFunction = <Args extends unknown[]>(
  fn: RawFunction<Args>,
  delay: number,
): [RawFunction<Args>, () => void] => {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearDebounceTimeout = useCallback(() => {
    if (debounceTimeoutRef.current !== null) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, [debounceTimeoutRef]);

  const debounceFunction = useCallback(
    (...args: Args) => {
      clearDebounceTimeout();
      debounceTimeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay, clearDebounceTimeout],
  );

  return [debounceFunction, clearDebounceTimeout];
};

export default useDebounceFunction;
