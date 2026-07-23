import { useCallback, useRef } from 'react';

/**
 * Creates a memoized callback that always has access to the latest state and props,
 * without needing to declare dependencies. Perfect for passing stable functions
 * into React Query selectors or custom hooks.
 */
// eslint-disable-next-line import/prefer-default-export, @typescript-eslint/no-explicit-any -- this is a utility function
export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);

  // Update the ref during render so it's immediately available to synchronous selectors
  ref.current = fn;

  return useCallback(
    (...args: Parameters<T>): ReturnType<T> => ref.current(...args),
    [],
  ) as unknown as T;
}
