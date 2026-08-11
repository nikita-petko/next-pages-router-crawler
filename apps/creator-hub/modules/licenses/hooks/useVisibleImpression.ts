import { useCallback, useEffect, useRef, type RefObject } from 'react';

export const IMPRESSION_VISIBILITY_THRESHOLD = 0.5;

/**
 * Returns a ref that logs one impression once the element is at least 50% visible in an active tab.
 */
export const useVisibleImpression = <T extends Element>(
  onImpression: () => void,
  enabled = true,
): RefObject<T | null> => {
  const elementRef = useRef<T>(null);
  const hasLoggedImpressionRef = useRef(false);
  const isElementVisibleRef = useRef(typeof IntersectionObserver === 'undefined');

  const logImpressionIfVisible = useCallback(() => {
    if (
      !enabled ||
      hasLoggedImpressionRef.current ||
      !isElementVisibleRef.current ||
      document.visibilityState !== 'visible'
    ) {
      return;
    }

    hasLoggedImpressionRef.current = true;
    onImpression();
  }, [enabled, onImpression]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      logImpressionIfVisible();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const element = elementRef.current;
    if (element == null) {
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    if (typeof IntersectionObserver === 'undefined') {
      isElementVisibleRef.current = true;
      logImpressionIfVisible();
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isElementVisibleRef.current =
          entry != null &&
          entry.isIntersecting &&
          entry.intersectionRatio >= IMPRESSION_VISIBILITY_THRESHOLD;
        logImpressionIfVisible();
      },
      { threshold: IMPRESSION_VISIBILITY_THRESHOLD },
    );
    observer.observe(element);
    logImpressionIfVisible();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [logImpressionIfVisible]);

  return elementRef;
};
