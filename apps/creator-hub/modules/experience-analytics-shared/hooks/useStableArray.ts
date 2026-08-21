import { useMemo } from 'react';

const parseStringArray = <T extends string>(signature: string): readonly T[] => {
  const parsed: unknown = JSON.parse(signature);
  if (
    !Array.isArray(parsed) ||
    !parsed.every((value: unknown): value is T => typeof value === 'string')
  ) {
    throw new Error('Stable array signature must contain only strings');
  }
  return parsed;
};

/**
 * Returns a referentially-stable `readonly T[]` for a sequence of string
 * primitives (chart-configurator enums). Equivalent sequences share identity
 * even when the caller passes a new array each render.
 *
 * Stability is keyed on `JSON.stringify(next)`, not element-wise `Object.is`.
 * `T extends string` is required: a non-string or sparse hole makes the parsed
 * signature invalid and throws.
 */
function useStableArray<T extends string>(next: readonly T[]): readonly T[] {
  const signature = JSON.stringify(next);
  return useMemo(() => parseStringArray<T>(signature), [signature]);
}

export default useStableArray;
