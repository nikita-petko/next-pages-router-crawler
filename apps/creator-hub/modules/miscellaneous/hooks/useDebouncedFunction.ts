import { useRef, useCallback, MutableRefObject } from 'react';

type DebouncedFunction<TArgs extends unknown[]> = (...args: TArgs) => void;

export const useDebouncedFunction = <Args extends unknown[]>(
  fn: DebouncedFunction<Args>,
  delay: number,
): [DebouncedFunction<Args>, () => void, MutableRefObject<number | null>] => {
  const debounceTimeoutRef = useRef<number | null>(null);

  const clearDebounceTimeout = useCallback(() => {
    if (debounceTimeoutRef.current !== null) {
      clearTimeout(debounceTimeoutRef.current);
      // INFO(cmccarty@20230629) clear ref so consumer can know whether
      // there is an active timer.
      debounceTimeoutRef.current = null;
    }
  }, [debounceTimeoutRef]);

  const debouncedFunction = useCallback(
    (...args: Args) => {
      clearDebounceTimeout();
      debounceTimeoutRef.current = window.setTimeout(() => {
        fn(...args);
        debounceTimeoutRef.current = null;
      }, delay);
    },
    [fn, delay, clearDebounceTimeout],
  );

  return [debouncedFunction, clearDebounceTimeout, debounceTimeoutRef];
};

export default useDebouncedFunction;
