import { useCallback, useMemo, useState } from 'react';
import type { Category } from '@rbx/client-shops-api/v1';
import { useStableCallback } from '@modules/monetization-shared/useStableCallback';
import { getShopItemKey, type ShopItem } from '../../types';
import { useShopItemOriginalsRef } from './useShopItemOriginalsRef';

export type ShopItemEdit = Partial<Pick<ShopItem, 'isVisibleInShop' | 'category'>>;

export type ShopItemInput = ShopItem | ShopItem[];

export type UsePendingShopItemEditsReturn = {
  draftItems: ShopItem[];
  availableCategories: readonly Category[];
  toggleVisibility: (item: ShopItem) => boolean;
  setBulkVisibility: (items: ShopItem[], isVisibleInShop: boolean) => boolean;
  setCategory: (items: ShopItemInput, nextCategory: Category) => boolean;
  renameCategory: (categoryId: string, newName: string) => boolean;
  addCategory: (items: ShopItemInput, name: string) => Category;
  pendingEdits: ReadonlyMap<string, ShopItemEdit>;
  pendingCategoryRenames: ReadonlyMap<string, string>;
  pendingNewCategories: ReadonlyMap<string, Category>;
  /** Stable getter reading the latest pending edits/renames/new categories at call time. */
  getPendingEdits: () => {
    pendingEdits: ReadonlyMap<string, ShopItemEdit>;
    pendingCategoryRenames: ReadonlyMap<string, string>;
    pendingNewCategories: ReadonlyMap<string, Category>;
  };
  categoryCountDeltas: ReadonlyMap<string, number>;
  hasPendingEdits: boolean;
  clear: () => void;
};

type State = {
  edits: ReadonlyMap<string, ShopItemEdit>;
  categoryRenames: ReadonlyMap<string, string>;
  newCategories: ReadonlyMap<string, Category>;
  categoryCountDeltas: ReadonlyMap<string, number>;
};

const EMPTY_EDITS: ReadonlyMap<string, ShopItemEdit> = new Map();
const EMPTY_RENAMES: ReadonlyMap<string, string> = new Map();
const EMPTY_NEW_CATEGORIES: ReadonlyMap<string, Category> = new Map();
const EMPTY_DELTAS: ReadonlyMap<string, number> = new Map();
const INITIAL_STATE: State = {
  edits: EMPTY_EDITS,
  categoryRenames: EMPTY_RENAMES,
  newCategories: EMPTY_NEW_CATEGORIES,
  categoryCountDeltas: EMPTY_DELTAS,
};

const DRAFT_CATEGORY_PREFIX = 'draft:';

// Generate a draft category id that won't collide with any server id or any
// existing draft id
function generateDraftCategoryId(takenIds: ReadonlySet<string>): string {
  let candidate = `${DRAFT_CATEGORY_PREFIX}${crypto.randomUUID()}`;
  while (takenIds.has(candidate)) {
    candidate = `${DRAFT_CATEGORY_PREFIX}${crypto.randomUUID()}`;
  }
  return candidate;
}

// Per-field equality. `undefined` on an edit field means "no override". For
// `category` we diff by id since the object identity is meaningless across
// refetches
function editMatchesOriginal(edit: ShopItemEdit, original: ShopItem): boolean {
  return (
    (edit.isVisibleInShop === undefined || edit.isVisibleInShop === original.isVisibleInShop) &&
    (edit.category === undefined || edit.category.id === original.category.id)
  );
}

function editsEqual(a: ShopItemEdit | undefined, b: ShopItemEdit | undefined): boolean {
  if (a === b) {
    return true;
  }
  return a?.isVisibleInShop === b?.isVisibleInShop && a?.category?.id === b?.category?.id;
}

// Returns the override merged onto an original, or `null` when the override
// matches the original (net no-op — should not be tracked as a pending edit).
function computeNextEdit(
  original: ShopItem,
  current: ShopItemEdit | undefined,
  patch: ShopItemEdit,
): ShopItemEdit | null {
  const next: ShopItemEdit = { ...current, ...patch };
  return editMatchesOriginal(next, original) ? null : next;
}

// Mutates `deltas` in place; collapses zero entries so size === 0 reliably
// signals "no pending category movement".
function bumpDelta(deltas: Map<string, number>, id: string, by: number): void {
  const next = (deltas.get(id) ?? 0) + by;
  if (next === 0) {
    deltas.delete(id);
  } else {
    deltas.set(id, next);
  }
}

function toItemArray(items: ShopItemInput): ShopItem[] {
  return Array.isArray(items) ? items : [items];
}

/**
 * Single source of truth for local-only edits to shop items (per-item
 * visibility/category) and to the category registry itself (renames + new
 * draft categories). Edits that revert to the server value drop out of the
 * diff; everything else survives refetches.
 *
 * Originals live in a ref mutated in place (not reallocated) so set
 * callbacks keep stable identities and avoid downstream rerender churn.
 */
export function usePendingShopItemEdits(
  items: ShopItem[],
  baseCategories: Category[],
): UsePendingShopItemEditsReturn {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const originalsById = useShopItemOriginalsRef(items);

  const { edits, categoryRenames, newCategories, categoryCountDeltas } = state;

  const baseCategoriesById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of baseCategories) {
      map.set(category.id, category);
    }
    return map;
  }, [baseCategories]);

  const availableCategories = useMemo(() => {
    const merged = new Map<string, Category>();
    for (const [id, category] of baseCategoriesById) {
      const renamed = categoryRenames.get(id);
      merged.set(id, renamed === undefined ? category : { ...category, name: renamed });
    }
    for (const [id, category] of newCategories) {
      merged.set(id, category);
    }
    return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [baseCategoriesById, categoryRenames, newCategories]);

  const draftItems = useMemo(() => {
    if (edits.size === 0 && categoryRenames.size === 0 && newCategories.size === 0) {
      return items;
    }
    return items.map((item) => {
      const patch = edits.get(getShopItemKey(item));
      const merged = patch ? { ...item, ...patch } : item;
      // Resolve the merged category id against the up-to-date draft registry
      // first, then fall back to the rename overlay on server categories.
      const draftCategory = newCategories.get(merged.category.id);
      if (draftCategory && draftCategory !== merged.category) {
        return { ...merged, category: draftCategory };
      }
      const renamed = categoryRenames.get(merged.category.id);
      if (renamed === undefined) {
        return merged;
      }
      return { ...merged, category: { ...merged.category, name: renamed } };
    });
  }, [items, edits, categoryRenames, newCategories]);

  const setBulkVisibility = useCallback(
    (itemsToEdit: ShopItem[], isVisibleInShop: boolean): boolean => {
      if (itemsToEdit.length === 0) {
        return false;
      }
      setState((prev) => {
        const newEdits = new Map(prev.edits);
        let changed = false;

        for (const item of itemsToEdit) {
          // Resolve the server-truth original and any in-flight pending patch,
          // then compute what the merged patch should be after this toggle.
          const key = getShopItemKey(item);
          const original = originalsById.get(key) ?? item;
          const current = newEdits.get(key);
          const nextEdit = computeNextEdit(original, current, { isVisibleInShop });

          if (nextEdit === null) {
            // Net no-op vs. the original — drop the entry so the diff stays minimal.
            if (newEdits.delete(key)) {
              changed = true;
            }
          } else if (!editsEqual(nextEdit, current)) {
            newEdits.set(key, nextEdit);
            changed = true;
          }
        }

        if (!changed) {
          return prev;
        }
        // Visibility toggles never move category counts or rename overlays.
        return { ...prev, edits: newEdits };
      });
      return true;
    },
    [originalsById],
  );

  const toggleVisibility = useCallback(
    (item: ShopItem): boolean => setBulkVisibility([item], !item.isVisibleInShop),
    [setBulkVisibility],
  );

  const setCategory = useCallback(
    (itemsToEdit: ShopItemInput, nextCategory: Category): boolean => {
      const targetItems = toItemArray(itemsToEdit);
      if (targetItems.length === 0) {
        return false;
      }

      setState((prev) => {
        const newEdits = new Map(prev.edits);
        const newDeltas = new Map(prev.categoryCountDeltas);
        let didEditChange = false;
        let didDeltaChange = false;

        for (const item of targetItems) {
          const key = getShopItemKey(item);
          const original = originalsById.get(key) ?? item;
          const currentEdit = newEdits.get(key);
          const nextEdit = computeNextEdit(original, currentEdit, { category: nextCategory });

          if (nextEdit === null) {
            if (newEdits.delete(key)) {
              didEditChange = true;
            } else {
              continue;
            }
          } else if (!editsEqual(nextEdit, currentEdit)) {
            newEdits.set(key, nextEdit);
            didEditChange = true;
          } else {
            continue;
          }

          // Move one count from the item's previous effective category to its next one.
          const originalId = original.category.id;
          const prevEffectiveCategoryId = currentEdit?.category?.id ?? originalId;
          const nextEffectiveCategoryId = nextEdit?.category?.id ?? originalId;

          if (prevEffectiveCategoryId !== nextEffectiveCategoryId) {
            bumpDelta(newDeltas, prevEffectiveCategoryId, -1);
            bumpDelta(newDeltas, nextEffectiveCategoryId, 1);
            didDeltaChange = true;
          }
        }

        if (!didEditChange) {
          return prev;
        }

        if (!didDeltaChange) {
          return { ...prev, edits: newEdits };
        }

        return { ...prev, edits: newEdits, categoryCountDeltas: newDeltas };
      });
      return true;
    },
    [originalsById],
  );

  const renameCategory = useCallback(
    (categoryId: string, newName: string): boolean => {
      if (!newCategories.has(categoryId) && !baseCategoriesById.has(categoryId)) {
        return false;
      }
      setState((prev) => {
        // Renaming a draft category mutates the entry in `newCategories` directly —
        // there's no server name to revert to, so the rename overlay is bypassed.
        const draftCategory = prev.newCategories.get(categoryId);
        if (draftCategory) {
          if (draftCategory.name === newName) {
            return prev;
          }
          const newDraftCategories = new Map(prev.newCategories);
          newDraftCategories.set(categoryId, { ...draftCategory, name: newName });
          return { ...prev, newCategories: newDraftCategories };
        }

        const baseCategory = baseCategoriesById.get(categoryId);
        if (!baseCategory) {
          return prev;
        }

        // Server-derived: overlay the new name unless it matches the base value,
        // in which case drop the overlay so the diff stays minimal.
        const currentOverlay = prev.categoryRenames.get(categoryId);
        if (newName === baseCategory.name) {
          if (currentOverlay === undefined) {
            return prev;
          }
          const newRenames = new Map(prev.categoryRenames);
          newRenames.delete(categoryId);
          return { ...prev, categoryRenames: newRenames };
        }

        if (currentOverlay === newName) {
          return prev;
        }
        const newRenames = new Map(prev.categoryRenames);
        newRenames.set(categoryId, newName);
        return { ...prev, categoryRenames: newRenames };
      });
      return true;
    },
    [baseCategoriesById, newCategories],
  );

  const addCategory = useCallback(
    (itemsToEdit: ShopItemInput, name: string): Category => {
      // Collision check covers every id consumers might already see — base
      // ids, in-flight renames keep their base id, and prior draft additions.
      const takenIds = new Set<string>(baseCategoriesById.keys());
      for (const id of newCategories.keys()) {
        takenIds.add(id);
      }
      const draftCategory: Category = {
        id: generateDraftCategoryId(takenIds),
        name,
      };

      setState((prev) => {
        const newDraftCategories = new Map(prev.newCategories);
        newDraftCategories.set(draftCategory.id, draftCategory);
        return { ...prev, newCategories: newDraftCategories };
      });

      setCategory(itemsToEdit, draftCategory);

      return draftCategory;
    },
    [baseCategoriesById, newCategories, setCategory],
  );

  const clear = useCallback(() => {
    setState((prev) =>
      prev.edits.size === 0 &&
      prev.categoryRenames.size === 0 &&
      prev.newCategories.size === 0 &&
      prev.categoryCountDeltas.size === 0
        ? prev
        : INITIAL_STATE,
    );
  }, []);

  const hasPendingEdits = edits.size > 0 || categoryRenames.size > 0;

  // Stable across renders (ref lives inside useStableCallback); reads the latest
  // pending state at call time
  const getPendingEdits = useStableCallback(() => ({
    pendingEdits: edits,
    pendingCategoryRenames: categoryRenames,
    pendingNewCategories: newCategories,
  }));

  return {
    draftItems,
    availableCategories,
    toggleVisibility,
    setBulkVisibility,
    setCategory,
    renameCategory,
    addCategory,
    pendingEdits: edits,
    pendingCategoryRenames: categoryRenames,
    pendingNewCategories: newCategories,
    getPendingEdits,
    categoryCountDeltas,
    hasPendingEdits,
    clear,
  } as const;
}
