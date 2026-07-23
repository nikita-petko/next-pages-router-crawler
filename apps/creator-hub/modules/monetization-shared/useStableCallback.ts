import { useCallback, useRef } from 'react';

/**
 * Creates a memoized callback that always has access to the latest state and props,
 * without needing to declare dependencies. Perfect for passing stable functions
 * into React Query selectors or custom hooks.
 */
// oxlint-disable-next-line typescript/no-explicit-any -- this is a utility function
export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);

  // Update the ref during render so it's immediately available to synchronous selectors
  ref.current = fn;

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- safe
  return useCallback(
    // oxlint-disable-next-line typescript/no-unsafe-return -- safe
    (...args: Parameters<T>): ReturnType<T> => ref.current(...args),
    [],
  ) as unknown as T;
}
