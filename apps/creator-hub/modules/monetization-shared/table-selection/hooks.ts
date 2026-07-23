import { useSyncExternalStore, useMemo, useCallback, useRef } from 'react';
import { countBy } from '../arrays';
import { useStableCallback } from '../useStableCallback';
import { useTableSelectionContext } from './context';
import { isSelectableResult, type SelectionState } from './store';

/**
 * Tri-state result of a bulk enable/disable toggle based on the current
 * viewable selection.
 *
 *   - 'none'      nothing is (viewable-)selected
 *   - 'enabling'  at least one viewable-selected item is NOT yet enabled
 *   - 'disabling' every viewable-selected item is already enabled
 */
export type BulkToggleAction = 'none' | 'enabling' | 'disabling';

/**
 * Handler invoked with the concrete bulk action ('enabling' | 'disabling').
 * The 'none' case is the disabled state and should never reach the handler.
 */
export type BulkActionHandler = (action: Exclude<BulkToggleAction, 'none'>) => void;

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
 * Subscribes to whether any viewable item is currently selected.
 * Optimized: Subscriber will ONLY re-render if this specific boolean flips.
 *
 * @example
 * const hasSelection = useHasViewableSelection<number, Product>();
 */
export function useHasViewableSelection<K extends string | number, T>(): boolean {
  const store = useTableSelectionContext<K, T>();
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot().viewableSelectedCount > 0);
}

/**
 * Subscribes to whether any viewable-selected item satisfies the given
 * predicate. Re-renders only when the resulting boolean flips. Inline
 * predicates are stabilized internally.
 *
 * @example
 * const hasNonEditableSelected = useHasMatchingViewableSelection<string, ShopItem>(
 *   (item) => !isVisibilityEditable(item),
 * );
 */
export function useHasMatchingViewableSelection<K extends string | number, T>(
  predicate: (item: T) => boolean,
): boolean {
  return useSelectionStore<K, T, boolean>((state) => {
    for (const [id, item] of state.selectedMap) {
      if (state.viewableIds.has(id) && predicate(item)) {
        return true;
      }
    }
    return false;
  });
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
 * Subscribes to the item checkbox state (checked, disabled, disabledReason).
 * Re-renders only when one of these values changes.
 *
 * When a `selectable` predicate is configured, non-selectable items are always disabled.
 * `selectable` behaves like a react-hook-form `validate` function: it returns `true` when
 * the item is selectable, or `false`/a reason string when it is not. A returned string is
 * surfaced here as `disabledReason`, similar to how RHF surfaces a `validate` string as a
 * field error message — callers can map known reasons to specific UI copy (e.g. a tooltip).
 */
export function useItemSelection<K extends string | number, T>(item: T) {
  const store = useTableSelectionContext<K, T>();
  const checked = useIsItemSelected<K, T>(item);
  const isLimitReached = useIsSelectionLimitReached<K, T>();
  const isSelectionDisabled = useIsSelectionDisabled<K, T>();

  const selectableResult = store.selectable(item);
  const isItemSelectable = isSelectableResult(selectableResult);
  const disabledReason = typeof selectableResult === 'string' ? selectableResult : undefined;
  const disabled = !isItemSelectable || isSelectionDisabled || (isLimitReached && !checked);

  return { checked, disabled, disabledReason } as const;
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
  const isSelectionDisabled =
    (disabled ?? false) || isModeSelectionDisabled || (!checked && isLimitReached);

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
    const next = getHeaderState(store.getSnapshot(), store.identifier, store.isSelectable);
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

/**
 * Pure selector that derives a {@link BulkToggleAction} from a selection
 * snapshot. Exported for direct store reads and unit testing without React.
 *
 * Only viewable selections are considered, so stale selections (present in
 * `selectedMap` but not in the current `items`) do not influence the result.
 *
 * `isEnabled` may return `null` to mark an item as ineligible for the bulk
 * action (e.g. type-specific exclusions). Ineligible items are skipped; if the
 * entire viewable selection is ineligible, the result is `'none'`.
 */
export function getBulkToggleAction<K extends string | number, T>(
  state: SelectionState<K, T>,
  isEnabled: (item: T) => boolean | null,
): BulkToggleAction {
  const { selectedMap, viewableSelectedCount, viewableIds } = state;
  if (viewableSelectedCount === 0 || viewableIds.size === 0) {
    return 'none';
  }

  let foundEligible = false;
  for (const [id, item] of selectedMap) {
    if (!viewableIds.has(id)) {
      continue;
    }
    const enabled = isEnabled(item);
    if (enabled === null) {
      continue;
    }
    foundEligible = true;
    if (!enabled) {
      return 'enabling';
    }
  }
  return foundEligible ? 'disabling' : 'none';
}

/**
 * Subscribes to the current {@link BulkToggleAction} for the viewable selection.
 *
 * Useful for rendering a context-aware "Enable/Disable" bulk action button:
 * the hook tells you whether the bulk action should enable, disable, or be
 * hidden entirely based on which viewable-selected items are already enabled.
 *
 * `isEnabled` may be an inline closure — it is internally stabilized. Return
 * `null` from `isEnabled` for items that should be ignored by the bulk action.
 *
 * @example
 * const action = useBulkToggleAction<string, ManagedProduct>(
 *   (p) => p.isManagedPricingEnabled,
 * );
 *
 * @example Mixed eligibility — GamePasses are ignored for visibility toggles:
 * const action = useBulkToggleAction<string, ShopItem>(
 *   (item) => isVisibilityEditable(item) ? item.isVisibleInShop : null,
 * );
 */
export function useBulkToggleAction<K extends string | number, T>(
  isEnabled: (item: T) => boolean | null,
): BulkToggleAction {
  const stableIsEnabled = useStableCallback(isEnabled);
  return useSelectionStore<K, T, BulkToggleAction>((state) =>
    getBulkToggleAction(state, stableIsEnabled),
  );
}
