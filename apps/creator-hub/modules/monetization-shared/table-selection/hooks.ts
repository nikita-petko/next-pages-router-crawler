import { useSyncExternalStore, useMemo, useCallback, useRef } from 'react';
import { useTableSelectionContext } from './context';
import type { SelectionState } from './store';
import { countBy } from '../arrays';

/**
 * Overload 1: No selector provided.
 * Subscribes to and returns the entire SelectionState object.
 *
 * @example
 * const state = useSelectionStore<number, Product>();
 * console.log(state.selectedMap.size);
 */
export function useSelectionStore<K extends string | number, T>(): SelectionState<K, T>;

/**
 * Overload 2: Selector provided.
 * Subscribes to a specific slice of the state.
 *
 * @example
 * const isLimitReached = useSelectionStore<number, Product, boolean>(
 * (state) => state.selectedMap.size >= state.data.limit
 * );
 */
export function useSelectionStore<K extends string | number, T, U>(
  selector: (state: SelectionState<K, T>) => U,
): U;

/**
 * A generic hook that subscribes to a specific slice of the selection store.
 *
 * @template K The primitive type of the unique ID.
 * @template T The object type of the row items.
 * @template U The return type of the selector.
 *
 * @param selector A function that takes the full state and returns a specific slice.
 *
 * @returns The selected slice of state.
 *
 * @example
 * // Subscribing to a primitive (boolean) - HIGHLY OPTIMIZED
 * const isSelected = useSelectionStore<number, Product, boolean>(
 * (state) => state.selectedMap.has(product.id)
 * );
 */
export function useSelectionStore<K extends string | number, T, U>(
  selector?: (state: SelectionState<K, T>) => U,
) {
  const store = useTableSelectionContext<K, T>();

  return useSyncExternalStore(
    store.subscribe,
    // If a selector is passed, run it against the snapshot.
    // If no selector is passed, just return the raw snapshot function.
    () => (selector ? selector(store.getSnapshot()) : store.getSnapshot()),
  );
}

/**
 * Subscribes to a specific item's boolean selection state.
 * Optimized: Subscriber will ONLY re-render if this specific boolean flips.
 *
 * @example
 * const isSelected = useIsItemSelected<number, Product>(product);
 */
export function useIsItemSelected<K extends string | number, T>(item: T): boolean {
  const store = useTableSelectionContext<K, T>();
  return useSyncExternalStore(store.subscribe, () => {
    const { identifier } = store;
    return store.getSnapshot().selectedMap.has(identifier(item));
  });
}

/**
 * Subscribes to the top-level selection state, the `disabled` flag passthrough.
 */
export function useIsSelectionDisabled<K extends string | number, T>(): boolean {
  const store = useTableSelectionContext<K, T>();
  return useSyncExternalStore(store.subscribe, () => !!store.getSnapshot().data.disabled);
}

/**
 * Retrieves the stable action functions to mutate the selection state.
 * Stable reference, avoids re-renders.
 *
 * @example
 * const { toggleItem, toggleBulk, reset } = useSelectionActions<number, Product>();
 */
export function useSelectionActions<K extends string | number, T>() {
  const store = useTableSelectionContext<K, T>();

  return useMemo(
    () =>
      ({
        toggleItem: store.toggleItem,
        toggleBulk: store.toggleBulk,
        reset: store.reset,
      }) as const,
    [store],
  );
}

/**
 * Subscribes to the viewable selection count.
 * `numSelected` reflects the count of selected items in the current `items` set.
 *
 * @example
 * const { numSelected } = useSelectionStats<number, Product>();
 */
export function useSelectionStats<K extends string | number, T>() {
  const store = useTableSelectionContext<K, T>();

  const numSelected = useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().viewableSelectedCount,
  );

  return { numSelected } as const;
}

/**
 * Subscribes to the selection limit to determine if it has been reached.
 * Optimized: Subscriber will ONLY re-render if this specific boolean flips.
 *
 * @example
 * const isSelectionLimitReached = useIsSelectionLimitReached<number, Product>();
 */
export function useIsSelectionLimitReached<K extends string | number, T>(): boolean {
  const store = useTableSelectionContext<K, T>();
  return useSyncExternalStore(
    store.subscribe,
    // Only re-renders if the boolean result of this equation changes
    () => {
      const { data, selectedMap } = store.getSnapshot();
      return data.limit !== undefined && selectedMap.size >= data.limit;
    },
  );
}

/**
 * Subscribes to the item checkbox state (checked, disabled).
 * Re-renders only when one of these values changes.
 * When a `selectable` predicate is configured, non-selectable items are always disabled.
 */
export function useItemSelection<K extends string | number, T>(item: T) {
  const store = useTableSelectionContext<K, T>();
  const checked = useIsItemSelected<K, T>(item);
  const isLimitReached = useIsSelectionLimitReached<K, T>();
  const isSelectionDisabled = useIsSelectionDisabled<K, T>();

  const isItemSelectable = store.selectable(item);
  const disabled = !isItemSelectable || isSelectionDisabled || (isLimitReached && !checked);

  return { checked, disabled } as const;
}

/**
 * Helper function to get the header booleans for the selection store.
 * Note this is split out specifically to target boolean state flags.
 * Filters through `selectable` so non-selectable items are excluded from all counts.
 */
function getHeaderState<K, T>(
  state: SelectionState<K, T>,
  identifier: (item: T) => K,
  selectableFn: (item: T) => boolean,
): { checked: boolean; indeterminate: boolean; disabled: boolean } {
  const {
    selectedMap,
    data: { currentPage, items, mode, limit, disabled },
  } = state;

  const selectableOnPage = currentPage.filter(selectableFn);

  const numSelectedOnPage = countBy(selectableOnPage, (item) => selectedMap.has(identifier(item)));

  const numSelectable = mode === 'all' ? countBy(items, selectableFn) : undefined;
  const hasSelectableOnPage = selectableOnPage.length > 0;
  const hasSelectAllLoaded = numSelectable !== undefined && numSelectable > 0;

  const isModeSelectionDisabled =
    (mode === 'page' && !hasSelectableOnPage) || (mode === 'all' && !hasSelectAllLoaded);

  const isLimitReached = limit !== undefined && selectedMap.size >= limit;

  const checked = numSelectedOnPage > 0;
  const indeterminate = numSelectedOnPage > 0 && numSelectedOnPage < selectableOnPage.length;
  const isSelectionDisabled = disabled || isModeSelectionDisabled || (!checked && isLimitReached);

  return { checked, indeterminate, disabled: isSelectionDisabled } as const;
}

/**
 * Subscribes only to the header checkbox states (checked, indeterminate, disabled).
 * Re-renders only when one of these values changes.
 */
export function useHeaderSelection<K extends string | number, T>() {
  const store = useTableSelectionContext<K, T>();
  // Note ref-based setup is to ensure object-based identity is maintained.
  // Opting for this until we get `useSyncExternalStoreWithSelector` with the equality check.
  // https://github.com/facebook/react/blob/main/packages/use-sync-external-store/src/useSyncExternalStoreWithSelector.js
  const cacheRef = useRef<Readonly<{
    checked: boolean;
    indeterminate: boolean;
    disabled: boolean;
  }> | null>(null);

  const getNextState = useCallback(() => {
    const next = getHeaderState(store.getSnapshot(), store.identifier, store.selectable);
    const prev = cacheRef.current;
    if (
      prev &&
      prev.checked === next.checked &&
      prev.indeterminate === next.indeterminate &&
      prev.disabled === next.disabled
    ) {
      return prev;
    }

    cacheRef.current = next;
    return next;
  }, [store]);

  return useSyncExternalStore(store.subscribe, getNextState);
}
