import { useCallback, useRef } from 'react';
import { useStableCallback } from './useStableCallback';

/**
 * A lightweight type that matches the shape of TanStack's InfiniteData
 * We only strictly care about the pages array for this logic.
 */
type InfiniteDataShape<TPage> = {
  pages: TPage[];
};

export type UseInfiniteReducerOptions<TPage, TResult> = {
  /** The starting value of the accumulator (e.g., 0 or false) */
  initialValue: TResult;
  /** Function to combine the current accumulated state with the next page */
  reducer: (acc: TResult, page: TPage) => TResult;
  /** Optional function to break the loop early if a condition is met */
  shouldShortCircuit?: (acc: TResult) => boolean;
};

const DEFAULT_SHORT_CIRCUIT_CALLBACK = () => false;

/**
 * A generalized accumulator for useInfiniteQuery that securely handles cache invalidations
 * and avoids re-parsing old pages on fetchNextPage.
 *
 * @example
 * ```ts
 * // Example: Counter
 * function useCountEligibleItems() {
 *   const countSelector = useInfiniteAccumulator({
 *     initialValue: 0,
 *     reducer: (total, page) => total + countEligibleItems(page),
 *   });
 *
 *   const { data: totalCount } = useInfiniteQuery({
 *     queryKey: ['items'],
 *     queryFn: fetchItems,
 *     getNextPageParam: (lastPage) => lastPage.nextPageToken,
 *     select: countSelector,
 *   });
 *
 *   return totalCount;
 * }
 * ```
 *
 * @example
 * ```ts
 * * // Example: Latch
 * function useHasAnyFlaggedItems() {
 *   const latchSelector = useInfiniteAccumulator({
 *     initialValue: false,
 *     reducer: (found, page) => found || page.items.some(item => item.isFlagged),
 *     shouldShortCircuit: (found) => found === true,
 *   });
 *
 *   const { data: hasAnyFlaggedItems } = useInfiniteQuery({
 *     queryKey: ['items'],
 *     queryFn: fetchItems,
 *     getNextPageParam: (lastPage) => lastPage.nextPageToken,
 *     select: latchSelector,
 *   });
 *
 *   return hasAnyFlaggedItems;
 * }
 * ```
 */
export function useInfiniteReducer<
  TPage,
  TResult,
  TData extends InfiniteDataShape<TPage> = InfiniteDataShape<TPage>,
>({ initialValue, reducer, shouldShortCircuit }: UseInfiniteReducerOptions<TPage, TResult>) {
  const resultRef = useRef<TResult>(initialValue); // Tracks current result
  const previousPagesRef = useRef<TPage[]>([]); // Tracks previous pages reference

  // Secure our closures using the stable callback pattern
  const stableReducer = useStableCallback(reducer);
  const stableShortCircuit = useStableCallback(
    shouldShortCircuit ?? DEFAULT_SHORT_CIRCUIT_CALLBACK,
  );

  const selectFn = useCallback(
    (data: TData): TResult => {
      const currentPages = data.pages;
      const previousPages = previousPagesRef.current;

      // SCENARIO 1: Cache is exactly the same reference
      if (currentPages === previousPages && currentPages.length === previousPages.length) {
        return resultRef.current;
      }

      const currentLength = currentPages.length;
      const previousLength = previousPages.length;

      const processPages = (pages: TPage[], startValue: TResult): TResult => {
        let acc = startValue;
        // eslint-disable-next-line no-restricted-syntax -- prefer for...of over forEach
        for (const page of pages) {
          acc = stableReducer(acc, page);
          if (stableShortCircuit(acc)) {
            break;
          }
        }
        return acc;
      };

      // SCENARIO 2: Invalidation or Reset Detection
      if (currentLength <= previousLength || currentLength === 1) {
        resultRef.current = processPages(currentPages, initialValue);
      }
      // SCENARIO 3: Append Detection
      else if (!stableShortCircuit(resultRef.current)) {
        const unparsedPages = currentPages.slice(previousLength);
        resultRef.current = processPages(unparsedPages, resultRef.current);
      }

      previousPagesRef.current = currentPages;
      return resultRef.current;
    },
    [initialValue, stableReducer, stableShortCircuit],
  );

  return selectFn;
}

/**
 * An optimized selector for useInfiniteQuery that only parses newly added pages.
 *
 * @param getPageCount A callback to extract the count from a single page
 * @returns A select function to be passed into useInfiniteQuery
 *
 * @example
 * ```ts
 * const counter = page => page.items.filter(isItemEligible).length;
 *
 * function useCountEligibleItems() {
 *   const countSelector = useInfiniteCountSelector(counter);
 *
 *   const { data: count } = useInfiniteQuery({
 *     queryKey: ['items'],
 *     queryFn: () => fetchItems(),
 *     getNextPageParam: (lastPage) => lastPage.nextPageToken,
 *     select: countSelector,
 *   });
 *
 *   return count;
 * }
 *
 * ```
 */
export function useInfiniteCounter<
  TPage,
  TData extends InfiniteDataShape<TPage> = InfiniteDataShape<TPage>,
>(getPageCount: (page: TPage) => number, shouldShortCircuit?: (acc: number) => boolean) {
  return useInfiniteReducer<TPage, number, TData>({
    initialValue: 0,
    reducer: (acc, page) => acc + getPageCount(page),
    shouldShortCircuit,
  });
}

/**
 * An optimized selector that checks if any page meets a condition.
 * Once true, it latches to true and entirely short-circuits future checks.
 *
 * @param checkPageCondition A function that returns a boolean for a given page
 * @returns A select function to be passed into useInfiniteQuery
 *
 * @example
 * ```ts
 * const isAnyPageEligible = (page) => page.items.some(isItemEligible);
 *
 * function useHasAnyEligibleItems() {
 *   const hasAnyEligibleSelector = useInfiniteLatchSelector(isAnyPageEligible);
 *
 *   const { data: hasAnyEligibleItems } = useInfiniteQuery({
 *     queryKey: ['items'],
 *     queryFn: () => fetchItems(),
 *     getNextPageParam: (lastPage) => lastPage.nextPageToken,
 *     select: hasAnyEligibleSelector,
 *   });
 *
 *   return hasAnyEligibleItems;
 * }
 * ```
 */
export function useInfiniteLatchSelector<
  TPage,
  TData extends InfiniteDataShape<TPage> = InfiniteDataShape<TPage>,
>(checkPageCondition: (page: TPage) => boolean) {
  return useInfiniteReducer<TPage, boolean, TData>({
    initialValue: false,
    reducer: (acc, page) => acc || checkPageCondition(page),
    shouldShortCircuit: (acc) => acc === true,
  });
}

/**
 * An optimized selector that incrementally flat-maps items out of infinite query pages.
 * Only newly appended pages are processed on fetchNextPage; invalidations reprocess from scratch.
 *
 * Instead of reprocessing every page on each cache update, it only runs your selector on newly appended
 * pages — giving you the result of a full `pages.flatMap(...)` at the cost of processing only the latest page.
 *
 * Advisory note: selector/filter functions must be pure and stable to avoid unexpected behavior. This is intended
 * to optimize for the typical use case of flatmapping paginated data, rather than dynamically transforming / filtering
 * data. For that use case, it is recommend to transform / filter by page slice than the entire accumulated list.
 *
 * @param selector Extracts (and optionally transforms / filters) an array of items from a single page.
 * @param filter Optional predicate applied to items after selection
 * @returns A select function to be passed into useInfiniteQuery
 *
 * @example
 * ```ts
 * const flattenProducts = useInfiniteFlatMap<PageResponse, Product>(
 *   (page) => page.products.map(transformProduct),
 *   (product) => product.isEligible,
 * );
 *
 * const { data: products = [] } = useInfiniteQuery({
 *   queryKey: ['products'],
 *   queryFn: fetchProducts,
 *   select: flattenProducts,
 * });
 * ```
 */
export function useInfiniteFlatMap<
  TPage,
  TItem,
  TData extends InfiniteDataShape<TPage> = InfiniteDataShape<TPage>,
>(selector: (page: TPage) => TItem[], filter?: (item: TItem) => boolean) {
  return useInfiniteReducer<TPage, TItem[], TData>({
    initialValue: [],
    reducer: (acc, page) => {
      const items = selector(page);
      return acc.concat(filter ? items.filter(filter) : items);
    },
  });
}
