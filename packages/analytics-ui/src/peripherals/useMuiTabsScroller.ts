import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Manages horizontal scroll state and programmatic scrolling for a MUI Tabs scroller.
 *
 * Tracks whether the scroller is at the start/end of its scroll range and exposes
 * a `handleScroll` callback for programmatic left/right scrolling.
 *
 * @param enabled - When false (e.g. on mobile), observers and listeners are skipped.
 *   The returned ref should still be attached so the DOM element is ready if `enabled` toggles.
 */
const useMuiTabsScroller = (enabled: boolean) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isStartOfScroll, setIsStartOfScroll] = useState(true);
  const [isEndOfScroll, setIsEndOfScroll] = useState(true);

  const refreshScrollState = useCallback(() => {
    const wrapper = wrapperRef.current;
    const scroller = wrapper?.querySelector('.MuiTabs-scroller') as HTMLElement | null;
    if (!scroller) {
      return;
    }
    setIsStartOfScroll(scroller.scrollLeft <= 0);
    setIsEndOfScroll(scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const scroller = enabled
      ? (wrapper?.querySelector('.MuiTabs-scroller') as HTMLElement | null)
      : null;

    if (!scroller) {
      return;
    }

    const updateScrollState = () => {
      setIsStartOfScroll(scroller.scrollLeft <= 0);
      setIsEndOfScroll(scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1);
    };

    const rafId = requestAnimationFrame(updateScrollState);
    scroller.addEventListener('scroll', updateScrollState);

    // Observe the inner flex container so we detect when tab content changes size.
    // ResizeObserver may be unavailable in test environments (JSDOM).
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollState);
      resizeObserver.observe(scroller);
      const flexContainer = scroller.firstElementChild;
      if (flexContainer) {
        resizeObserver.observe(flexContainer);
      }
    }

    return () => {
      cancelAnimationFrame(rafId);
      scroller.removeEventListener('scroll', updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [enabled]);

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    const wrapper = wrapperRef.current;
    const scroller = wrapper?.querySelector('.MuiTabs-scroller');
    if (!scroller) {
      return;
    }
    const scrollAmount = scroller.clientWidth * 0.75;
    scroller.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  return { wrapperRef, isStartOfScroll, isEndOfScroll, handleScroll, refreshScrollState };
};

export default useMuiTabsScroller;
