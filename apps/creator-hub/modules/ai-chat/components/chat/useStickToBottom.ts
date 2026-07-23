import { useCallback, useEffect, useRef, useState } from 'react';

export const NEAR_BOTTOM_THRESHOLD_PX = 50;

// Upper bound for how long re-pinning stays suppressed after releasePin. Acts as
// a fallback so suppression always clears even when the scroll produces no
// scroll events (zero-distance navigation, browsers without scrollend, etc.).
const SUPPRESS_PIN_DURATION_MS = 1000;

export function isNearBottom({
  scrollHeight,
  scrollTop,
  clientHeight,
  threshold = NEAR_BOTTOM_THRESHOLD_PX,
}: {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
  threshold?: number;
}): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

export function useStickToBottom<T>(dependency: T) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const suppressPinRef = useRef(false);
  const suppressPinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPinned, setIsPinned] = useState(true);

  const clearSuppressPin = useCallback(() => {
    suppressPinRef.current = false;
    if (suppressPinTimeoutRef.current !== null) {
      clearTimeout(suppressPinTimeoutRef.current);
      suppressPinTimeoutRef.current = null;
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
  }, []);

  const reconcilePin = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const nearBottom = isNearBottom({
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
    });
    if (nearBottom !== pinnedRef.current) {
      pinnedRef.current = nearBottom;
      setIsPinned(nearBottom);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const nearBottom = isNearBottom({
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
    });
    if (suppressPinRef.current) {
      if (!nearBottom) {
        clearSuppressPin();
        if (!pinnedRef.current) {
          setIsPinned(false);
        }
      }
      return;
    }
    reconcilePin();
  }, [clearSuppressPin, reconcilePin]);

  const pinToBottom = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      clearSuppressPin();
      if (!pinnedRef.current) {
        pinnedRef.current = true;
        setIsPinned(true);
      }
      scrollToBottom(behavior);
    },
    [clearSuppressPin, scrollToBottom],
  );

  const unpin = useCallback(() => {
    if (pinnedRef.current) {
      pinnedRef.current = false;
      setIsPinned(false);
    }
  }, []);

  const releasePin = useCallback(() => {
    pinnedRef.current = false;
    suppressPinRef.current = true;
    if (suppressPinTimeoutRef.current !== null) {
      clearTimeout(suppressPinTimeoutRef.current);
    }
    suppressPinTimeoutRef.current = setTimeout(() => {
      suppressPinRef.current = false;
      suppressPinTimeoutRef.current = null;
      reconcilePin();
    }, SUPPRESS_PIN_DURATION_MS);
  }, [reconcilePin]);

  useEffect(() => {
    if (pinnedRef.current && !suppressPinRef.current) {
      scrollToBottom();
    }
  }, [dependency, scrollToBottom]);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (typeof ResizeObserver === 'undefined' || !contentEl) {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current && !suppressPinRef.current) {
        scrollToBottom();
      }
    });
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  useEffect(() => {
    return () => {
      if (suppressPinTimeoutRef.current !== null) {
        clearTimeout(suppressPinTimeoutRef.current);
      }
    };
  }, []);

  return { scrollRef, contentRef, isPinned, handleScroll, pinToBottom, unpin, releasePin };
}
