import { useEffect, useRef } from 'react';

export interface UseScrollToHashTargetOptions {
  /**
   * The ID to match against the URL hash
   */
  targetId: string;
  /**
   * Debounce delay in ms after content mutations before scrolling (default: 300)
   */
  debounceDelay?: number;
  /**
   * Maximum time in ms to wait for content to load before forcing scroll (default: 3000)
   */
  fallbackTimeout?: number;
  /**
   * Scroll behavior (default: 'smooth')
   */
  behavior?: ScrollBehavior;
  /**
   * Scroll block alignment (default: 'start')
   */
  block?: ScrollLogicalPosition;
  /**
   * Whether the hook is enabled (default: true)
   */
  enabled?: boolean;
}

/**
 * A reusable hook that automatically scrolls to an element when the URL hash matches the provided targetId.
 * Uses MutationObserver to wait for dynamic content to load before scrolling.
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const scrollRef1 = useScrollToHashTarget({ targetId: 'section-1' });
 *   const scrollRef2 = useScrollToHashTarget({ targetId: 'section-2' });
 *
 *   return (
 *     <>
 *       <div id="section-1" ref={scrollRef1}>Content 1</div>
 *       <div id="section-2" ref={scrollRef2}>Content 2</div>
 *     </>
 *   );
 * };
 * ```
 */
export function useScrollToHashTarget<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollToHashTargetOptions,
) {
  const {
    targetId,
    debounceDelay = 300,
    fallbackTimeout: fallbackTimeoutDelay = 3000,
    behavior = 'smooth',
    block = 'start',
    enabled = true,
  } = options;

  const scrollTargetRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !targetId) return undefined;

    let hasScrolled = false;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimeout: ReturnType<typeof setTimeout> | null = null;
    let mutationObserver: MutationObserver | null = null;

    const scrollToElement = () => {
      if (hasScrolled) return;
      const element = scrollTargetRef.current;
      if (element) {
        hasScrolled = true;
        element.scrollIntoView({ behavior, block });
        mutationObserver?.disconnect();
        if (fallbackTimeout) clearTimeout(fallbackTimeout);
      }
    };

    const setupScrollObserver = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash !== targetId) return;

      const element = scrollTargetRef.current;
      if (!element) return;

      hasScrolled = false;

      // Watch for DOM mutations (content loading) and debounce scroll attempts
      mutationObserver = new MutationObserver(() => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(scrollToElement, debounceDelay);
      });

      mutationObserver.observe(element, { childList: true, subtree: true });

      // Fallback: force scroll after timeout even if content is still loading
      fallbackTimeout = setTimeout(() => {
        if (!hasScrolled) scrollToElement();
      }, fallbackTimeoutDelay);
    };

    // Initial setup
    setupScrollObserver();

    // Re-setup on hash change
    const handleHashChange = () => {
      mutationObserver?.disconnect();
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      hasScrolled = false;
      setupScrollObserver();
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      mutationObserver?.disconnect();
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
  }, [targetId, debounceDelay, fallbackTimeoutDelay, behavior, block, enabled]);

  return scrollTargetRef;
}

export default useScrollToHashTarget;
