import { useRef } from 'react';

/**
 * Returns a referentially-stable version of the given array.
 * If every element in `next` is the same reference as the corresponding
 * element in the previously returned array, the previous array is returned
 * instead — preserving identity for downstream dependency checks.
 *
 * Comparison is element-wise by `Object.is` (reference equality).
 */
function useStableArray<T>(next: readonly T[]): readonly T[] {
  const ref = useRef<readonly T[]>(next);
  const prev = ref.current;
  const stable =
    prev.length === next.length && prev.every((item, i) => Object.is(item, next[i])) ? prev : next;
  ref.current = stable;
  return stable;
}

export default useStableArray;
