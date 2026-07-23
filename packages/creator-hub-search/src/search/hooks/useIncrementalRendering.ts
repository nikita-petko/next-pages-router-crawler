import { useState, useEffect, useRef, useCallback } from 'react';

const INITIAL_BATCH_SIZE = 20;
const LOAD_MORE_BATCH_SIZE = 20;

/**
 * Walks up the DOM from `element` to find the nearest ancestor with
 * scrollable overflow (auto or scroll on the Y axis).
 */
function getScrollParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent);
    if (/(auto|scroll)/.test(overflow + overflowY)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

/**
 * Progressively renders a large list by showing items in batches.
 * Uses IntersectionObserver on a sentinel element to trigger loading more items
 * as the user scrolls down. This avoids rendering hundreds/thousands of DOM nodes
 * at once when search results are large (e.g. Hub filter with many experiences).
 *
 * The observer automatically detects the nearest scrollable ancestor and uses it
 * as the observation root so it works inside nested scroll containers (e.g. dialogs).
 *
 * @param totalCount - Total number of items in the list
 * @returns visibleCount and a ref callback to attach to the sentinel element
 */
export default function useIncrementalRendering(totalCount: number) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH_SIZE);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [totalCount]);

  const hasMore = visibleCount < totalCount;

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node || !hasMore) {
        return;
      }

      const scrollParent = getScrollParent(node);

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + LOAD_MORE_BATCH_SIZE, totalCount));
          }
        },
        { root: scrollParent, rootMargin: '200px' },
      );

      observerRef.current.observe(node);
    },
    // visibleCount is intentionally included even though it's not referenced in the
    // callback body. IntersectionObserver only fires on transitions (not-intersecting →
    // intersecting), so if the sentinel is already visible (e.g. content doesn't overflow
    // the scroll container), the observer fires once and then goes silent. By including
    // visibleCount, each batch load changes the callback identity, causing React to
    // re-invoke the ref (disconnect old observer → create fresh one that fires immediately
    // if the sentinel is still visible), cascading until content overflows or all items load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasMore, totalCount, visibleCount],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { visibleCount, sentinelRef, hasMore };
}
