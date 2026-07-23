export type SelectionMode = 'all' | 'page';

export type SelectionConfig<T> = {
  /** The current page of items */
  currentPage: T[];
  /**  The total (filtered or not) list of items, if applicable. Used for `all` mode selection. */
  items: T[];
  /** The selection mode */
  mode: SelectionMode;
  /** The maximum number of items that can be selected */
  limit?: number;
  /** Whether selection is disabled */
  disabled?: boolean;
};

export type SelectionState<K, T> = {
  selectedMap: Map<K, T>;
  /** Count of selected items that are in the current `items` (viewable) set. */
  viewableSelectedCount: number;
  /** Set of IDs derived from `items`. Stable reference between filter changes; only rebuilt when `items` changes. */
  viewableIds: ReadonlySet<K>;
  data: SelectionConfig<T>;
};

/**
 * Result of a {@link SelectionStoreParams.selectable} check, modeled after a
 * react-hook-form `validate` function: return `true` when the item is
 * selectable, or `false`/a reason string when it is not. When a string is
 * returned it is surfaced verbatim as `disabledReason` from `useItemSelection`,
 * so callers can map it to specific UI copy (e.g. a tooltip).
 */
export type SelectableResult = boolean | string;

export type SelectionStoreParams<K extends string | number, T> = {
  /** A function to extract the unique identifier from an item. */
  identifier: (item: T) => K;
  /**
   * Optional predicate that determines whether an individual item is selectable.
   * Similar to a react-hook-form `validate` function: return `true` when the item
   * is selectable, or `false`/a reason string when it is not. When provided,
   * non-selectable items are excluded from toggle/bulk actions, shown as disabled
   * in hooks, and auto-evicted from the selection on data sync.
   */
  selectable?: (item: T) => SelectableResult;
};

const defaultSelectable = (): SelectableResult => true;

/** Normalizes a {@link SelectableResult} to a boolean: only `true` is selectable. */
export function isSelectableResult(result: SelectableResult): boolean {
  return result === true;
}

function computeViewableSelectedCount<K extends string | number, T>(
  selectedMap: Map<K, T>,
  viewableIds: Set<K>,
): number {
  if (viewableIds.size === 0) {
    return 0;
  }

  let count = 0;
  for (const id of selectedMap.keys()) {
    if (viewableIds.has(id)) {
      count += 1;
    }
  }

  return count;
}

/**
 * Creates a vanilla pub-sub store for managing table selections.
 *
 * @template K The primitive type of the unique ID (e.g., number or string).
 * @template T The object type of the row items.
 *
 * @param params Store configuration callbacks.
 * @param params.identifier A function to extract the unique identifier from an item.
 * @param params.selectable Optional per-item selectability predicate.
 * @param initialData The initial dataset and configuration.
 *
 * @example
 * const store = createSelectionStore(
 *   { identifier: (user) => user.uuid, selectable: (user) => user.isActive },
 *   { currentPage: [], items: [], mode: 'page', limit: 50 },
 * );
 */
export function createSelectionStore<K extends string | number, T>(
  params: SelectionStoreParams<K, T>,
  initialData: SelectionConfig<T>,
) {
  const { identifier, selectable = defaultSelectable } = params;
  /** Boolean-normalized view of `selectable`, used for internal toggle/filter logic. */
  const isSelectable = (item: T): boolean => isSelectableResult(selectable(item));

  function buildViewableIdSet(items: T[]): Set<K> {
    return new Set(items.map(identifier));
  }

  let viewableIds = buildViewableIdSet(initialData.items);

  let state: SelectionState<K, T> = {
    selectedMap: new Map<K, T>(),
    viewableSelectedCount: 0,
    viewableIds,
    data: initialData,
  };

  /** Subscribers to the store. */
  const listeners = new Set<() => void>();

  /** Emits an update to all subscribers. */
  const emit = () => listeners.forEach((listener) => listener());

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getSnapshot: () => state,

    /**
     * Returns selected items that are in the current `items` (viewable) set.
     * Filters `items` (not `selectedMap`) to preserve fresh item references.
     * Intended for imperative use (e.g. bulk action submit), not reactive subscriptions.
     */
    getSelectedViewableItems: () => {
      const { data, selectedMap } = state;
      return data.items.filter((item) => selectedMap.has(identifier(item)));
    },

    identifier,

    /** Raw predicate, as passed to `createSelectionStore` (may return a reason string). */
    selectable,

    /** Boolean-normalized `selectable`, used for filtering/counting (e.g. header state). */
    isSelectable,

    /**
     * Pushes new React props (like background-fetched data) into the store.
     * Emits an update so stats hooks can recalculate totals.
     * Rebuilds `viewableIds` and recomputes `viewableSelectedCount` when `items` changes.
     * When `selectable` is provided and `items` changes, reconciles the selection by
     * removing entries that are no longer selectable.
     */
    syncData: (newData: SelectionConfig<T>) => {
      const itemsChanged = state.data.items !== newData.items;

      if (
        state.data.currentPage !== newData.currentPage ||
        itemsChanged ||
        state.data.mode !== newData.mode ||
        state.data.limit !== newData.limit ||
        state.data.disabled !== newData.disabled
      ) {
        let { selectedMap } = state;

        if (itemsChanged) {
          viewableIds = buildViewableIdSet(newData.items);

          if (selectable !== defaultSelectable && selectedMap.size > 0) {
            const freshItemMap = new Map(newData.items.map((item) => [identifier(item), item]));
            let reconciledMap: Map<K, T> | undefined;

            for (const [id] of selectedMap) {
              const freshItem = freshItemMap.get(id);
              if (freshItem && !isSelectable(freshItem)) {
                reconciledMap ??= new Map(selectedMap);
                reconciledMap.delete(id);
              }
            }

            if (reconciledMap) {
              selectedMap = reconciledMap;
            }
          }
        }

        const viewableSelectedCount =
          itemsChanged || selectedMap !== state.selectedMap
            ? computeViewableSelectedCount(selectedMap, viewableIds)
            : state.viewableSelectedCount;

        state = { ...state, data: newData, selectedMap, viewableSelectedCount, viewableIds };
        emit();
      }
    },

    /** Toggles a single item's selection status. Select path is guarded by `selectable`. */
    toggleItem: (item: T, isChecked: boolean) => {
      let { viewableSelectedCount } = state;

      const nextMap = new Map(state.selectedMap);
      const id = identifier(item);
      const wasAlreadySelected = nextMap.has(id);

      const isSelectionUnderLimit =
        state.data.limit === undefined || nextMap.size < state.data.limit;
      const isInViewableItems = viewableIds.has(id);

      if (isChecked && !wasAlreadySelected && isSelectionUnderLimit && isSelectable(item)) {
        nextMap.set(id, item);
        if (isInViewableItems) {
          viewableSelectedCount += 1;
        }
      }

      if (!isChecked && wasAlreadySelected) {
        nextMap.delete(id);
        if (isInViewableItems) {
          viewableSelectedCount -= 1;
        }
      }

      state = { ...state, selectedMap: nextMap, viewableSelectedCount };
      emit();
    },

    /** Toggles bulk selection based on the current 'mode' configuration.
     *  Select path filters through `selectable`; deselect path removes all items in the target. */
    toggleBulk: (isChecked: boolean) => {
      const nextMap = new Map(state.selectedMap);
      const { mode, items, currentPage, limit } = state.data;

      const targetArray = mode === 'all' ? items : currentPage;

      if (isChecked) {
        targetArray.forEach((item) => {
          if ((limit === undefined || nextMap.size < limit) && isSelectable(item)) {
            nextMap.set(identifier(item), item);
          }
        });
      } else {
        targetArray.forEach((item) => nextMap.delete(identifier(item)));
      }

      const viewableSelectedCount = computeViewableSelectedCount(nextMap, viewableIds);
      state = { ...state, selectedMap: nextMap, viewableSelectedCount };
      emit();
    },

    /** Clears all selections. */
    reset: () => {
      state = { ...state, selectedMap: new Map(), viewableSelectedCount: 0 };
      emit();
    },
  };
}
