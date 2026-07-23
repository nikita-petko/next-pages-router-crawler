import type { ReactNode } from 'react';

/**
 * Foundation `Radio` accepts rich `label` nodes at runtime, but its props are typed as `string`.
 * Use this helper at call sites so the unsafe cast lives in one place.
 */
export function foundationRadioLabel(node: ReactNode): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Foundation Radio accepts ReactNode at runtime; props typed as string
  return node as unknown as string;
}
