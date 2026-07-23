import { useEffect, useMemo, useRef } from 'react';
import { Locale } from '@rbx/intl';
import { UnifiedLogger } from '@rbx/unified-logger';
import { ESearchEventName } from '../../eventStream/enum/DocsSiteSearch';

interface SearchResultImpressionParams {
  currentProduct: string;
  locale: Locale;
  query: string;
  rank: number;
  resultCategory: string;
  resultTitle: string;
  resultUrl: string;
  searchSessionId: string;
}

/**
 * Tracks when a search result item becomes visible in the viewport.
 * Follows the same IntersectionObserver pattern as useNotificationImpressionTracker.
 *
 * Fires once per unique result per search session (deduped by resultUrl + searchSessionId).
 */
function useSearchResultImpressionTracker(
  ref: React.RefObject<HTMLElement | null>,
  unifiedLoggerClient: UnifiedLogger,
  params: SearchResultImpressionParams | null,
): void {
  const firedRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<number | null>(null);

  const searchSessionId = params?.searchSessionId;
  const resultUrl = params?.resultUrl;
  const currentProduct = params?.currentProduct;
  const locale = params?.locale;
  const query = params?.query;
  const rank = params?.rank;
  const resultCategory = params?.resultCategory;
  const resultTitle = params?.resultTitle;

  const debouncedLogImpression = useMemo(() => {
    const log = () => {
      if (searchSessionId == null || resultUrl == null) return;

      const dedupKey = `${searchSessionId}:${resultUrl}`;
      if (firedRef.current.has(dedupKey)) return;
      firedRef.current.add(dedupKey);

      unifiedLoggerClient.logImpressionEvent({
        eventName: ESearchEventName.ResultItemImpression,
        parameters: {
          currentProduct: currentProduct ?? '',
          locale: locale ?? '',
          query: query ?? '',
          rank: rank != null ? rank.toString() : '',
          refPageUrl: window.location.pathname,
          resultCategory: resultCategory ?? '',
          resultTitle: resultTitle ?? '',
          resultUrl,
          searchSessionId,
        },
      });
    };

    const debounced = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(log, 100);
    };

    const cancel = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    return { debounced, cancel };
  }, [
    searchSessionId,
    resultUrl,
    currentProduct,
    locale,
    query,
    rank,
    resultCategory,
    resultTitle,
    unifiedLoggerClient,
  ]);

  useEffect(() => {
    const node = ref.current;
    if (!node || searchSessionId == null) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            debouncedLogImpression.debounced();
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.5 },
    );

    observer.observe(node);
    return () => {
      observer.unobserve(node);
      observer.disconnect();
      debouncedLogImpression.cancel();
    };
  }, [ref, searchSessionId, resultUrl, debouncedLogImpression]);
}

export default useSearchResultImpressionTracker;
