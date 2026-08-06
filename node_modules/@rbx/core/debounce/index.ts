export type DebouncedFn<T extends Array<unknown>> = (...args: T) => void;

export type Debounce = {
  <T extends Array<unknown>>(fn: (...args: T) => void, ms?: number): [DebouncedFn<T>, () => void];
};

/**
 * Returns a debounced version of `fn` that delays invocation until `ms`
 * milliseconds have elapsed since the last call (trailing edge).
 *
 * @returns A tuple of `[debouncedFn, cancel]`.
 */
const debounce: Debounce = <T extends Array<unknown>>(
  fn: (...args: T) => void,
  ms = 300,
): [DebouncedFn<T>, () => void] => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return [
    (...args: T) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    },
    () => {
      clearTimeout(timer);
    },
  ];
};

export default debounce;
