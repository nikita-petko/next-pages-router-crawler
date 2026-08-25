import { useCallback, useState } from 'react';
import type { RefObject } from 'react';
import { useEventListener } from './useEventListener';

/**
 * Tracks whether the pointer is over the referenced element using `mouseenter` and `mouseleave`.
 * Prefer `:hover` and related CSS when styling alone is enough; use this when JavaScript needs to
 * react to hover (e.g. toggling non-CSS behavior or coordinating with other state).
 *
 * @param elementRef - Ref whose `current` node receives the hover listeners.
 * @returns `true` while the element is hovered, otherwise `false`.
 *
 * @example
 * ```tsx
 * import { useRef } from 'react';
 * import { useIsHovered } from '@modules/monetization-shared/useIsHovered';
 *
 * export function Example() {
 *   const hoverRef = useRef<HTMLDivElement>(null);
 *   const isHovered = useIsHovered(hoverRef);
 *
 *   return (
 *     <div ref={hoverRef}>
 *       The current element is {isHovered ? 'hovered' : 'unhovered'}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsHovered<T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T | null>,
): boolean {
  const [value, setValue] = useState<boolean>(false);

  const handleMouseEnter = useCallback(() => setValue(true), []);
  const handleMouseLeave = useCallback(() => setValue(false), []);

  useEventListener('mouseenter', handleMouseEnter, elementRef);
  useEventListener('mouseleave', handleMouseLeave, elementRef);

  return value;
}
