import { useCallback, useRef } from 'react';
import useIsomorphicLayoutEffect from './useIsomorphicLayoutEffect';

// * NOTE(zwang, 12/06/23): full context at https://github.com/facebook/react/issues/14099#issuecomment-440013892
export default function useEventCallback<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
) {
  const ref = useRef<typeof fn>(() => {
    throw new Error('Cannot call an event callback while rendering');
  });

  useIsomorphicLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);

  return useCallback((...args: TArgs) => ref.current(...args), [ref]);
}
