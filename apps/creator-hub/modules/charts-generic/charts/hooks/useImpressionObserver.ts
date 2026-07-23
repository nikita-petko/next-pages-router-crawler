import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';

const emptyFunction = () => {};

type ImpressionObserverResetTrigger = 'instance' | 'callback';

/**
 * Following https://go/game_impressions_web_definition
 * Only log an impression event if:
 * - we haven't logged an impression event already
 * - the given elementRef is more than 50% visible (IntersectionObserver threshold = 0.5)
 * - the IntersectionObserver does not reverse its visibility judgement within 0.25s (250ms to useDebounceFunction)
 */
const useImpressionObserver = (
  elementRef: RefObject<HTMLElement | null>,
  onSustainedImpression: () => void,
  {
    debounceDelay,
    intersectionObserverThreshold,
    resetOncePer: givenResetOncePer,
  }: {
    debounceDelay?: number;
    intersectionObserverThreshold?: number;
    resetOncePer?: ImpressionObserverResetTrigger;
  } = {},
) => {
  const hasSentImpressionEvent = useRef(false);

  const handleSustainedImpression = useCallback(
    (isVisible: boolean) => {
      // If the last debounced call is back to false, we scrolled by too quickly
      if (!isVisible) {
        return;
      }
      // if we've already sent an impression event we should not send another
      if (hasSentImpressionEvent.current) {
        return;
      }
      // otherwise we note that we've sent it (do not double-send) and call the callback
      hasSentImpressionEvent.current = true;
      onSustainedImpression();
    },
    [onSustainedImpression],
  );
  const [debouncedHandleImpression] = useDebouncedFunction(
    handleSustainedImpression,
    debounceDelay ?? 250,
  );
  const observerHandler = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      debouncedHandleImpression(entry.isIntersecting);
    },
    [debouncedHandleImpression],
  );

  // when the callback changes, we can send an impression event again
  const resetOncePer = givenResetOncePer ?? 'instance';
  useMemo(() => {
    if (resetOncePer === 'callback') {
      hasSentImpressionEvent.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- event not sent for this callback yet
  }, [onSustainedImpression]);

  useEffect(() => {
    if (!elementRef.current) return emptyFunction;
    const observer = new IntersectionObserver(observerHandler, {
      threshold: intersectionObserverThreshold ?? 0.5,
    });
    observer.observe(elementRef.current);
    return () => {
      observer.disconnect();
    };
  }, [elementRef, intersectionObserverThreshold, observerHandler]);
};
export default useImpressionObserver;
