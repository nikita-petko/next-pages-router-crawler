import type { QueryClient } from '@tanstack/react-query';
import type {
  Category,
  GetShopConfigResponse,
  ShopItem as ApiShopItem,
} from '@rbx/client-shops-api/v1';
import { shopsKeys } from '../../queries/constants';
import type { InfiniteShopItemsData } from '../../queries/useInfiniteListShopItems';
import type { ShopItemEdit } from '../hooks/usePendingShopItemEdits';
import type { PendingShopItemEdits } from './transformBatchUpdateShopItemsRequest';

type OptimisticVariables = { shopId: number } & PendingShopItemEdits;

function apiShopItemKey(item: ApiShopItem): string {
  return `${item.item.type}-${item.item.id}`;
}

/**
 * Maps each draft category id to its server-assigned category. They
 * are matched back by name — unambiguous since the add/edit dialogs block
 * duplicate category names
 */
function reconcileCreatedCategories(
  pendingNewCategories: ReadonlyMap<string, Category>,
  createdCategories: readonly Category[],
): Map<string, Category> {
  const draftIdToReal = new Map<string, Category>();
  if (pendingNewCategories.size === 0 || createdCategories.length === 0) {
    return draftIdToReal;
  }
  const createdByName = new Map(createdCategories.map((category) => [category.name, category]));
  for (const [draftId, draft] of pendingNewCategories) {
    const real = createdByName.get(draft.name);
    if (real) {
      draftIdToReal.set(draftId, real);
    }
  }
  return draftIdToReal;
}

/**
 * Folds renames onto existing categories (by id) and appends any newly created
 * categories not already present.
 */
function applyCategoryChanges(
  categories: readonly Category[],
  renames: ReadonlyMap<string, string>,
  createdCategories: readonly Category[],
): Category[] {
  const renamed = categories.map((category) => {
    const newName = renames.get(category.id);
    return newName === undefined || newName === category.name
      ? category
      : { ...category, name: newName };
  });
  if (createdCategories.length === 0) {
    return renamed;
  }
  const existingIds = new Set(renamed.map((category) => category.id));
  const additions = createdCategories.filter((category) => !existingIds.has(category.id));
  return additions.length === 0 ? renamed : [...renamed, ...additions];
}

// Resolves an item's post-publish category: a reassigned draft id maps to its
// server category, a reassigned/unchanged server id picks up any rename overlay.
function resolveItemCategory(
  item: ApiShopItem,
  edit: ShopItemEdit | undefined,
  renames: ReadonlyMap<string, string>,
  draftIdToReal: ReadonlyMap<string, Category>,
): Category {
  if (edit?.category !== undefined) {
    const real = draftIdToReal.get(edit.category.id);
    if (real) {
      return real;
    }
    const renamed = renames.get(edit.category.id);
    return renamed === undefined || renamed === edit.category.name
      ? edit.category
      : { id: edit.category.id, name: renamed };
  }
  const renamed = renames.get(item.category.id);
  return renamed === undefined || renamed === item.category.name
    ? item.category
    : { ...item.category, name: renamed };
}

function applyEditsToPages(
  data: InfiniteShopItemsData,
  pendingEdits: ReadonlyMap<string, ShopItemEdit>,
  renames: ReadonlyMap<string, string>,
  draftIdToReal: ReadonlyMap<string, Category>,
): InfiniteShopItemsData {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((item) => {
        const edit = pendingEdits.get(apiShopItemKey(item));
        const nextVisibility = edit?.isVisibleInShop ?? item.isVisibleInShop;
        const nextCategory = resolveItemCategory(item, edit, renames, draftIdToReal);
        // Preserve identity when nothing changed so downstream selectors don't churn.
        if (nextVisibility === item.isVisibleInShop && nextCategory === item.category) {
          return item;
        }
        return { ...item, isVisibleInShop: nextVisibility, category: nextCategory };
      }),
    })),
  };
}

/**
 * Writes the just-published edits straight into the cached item pages and the
 * creator shop config's category registry, using the server-assigned category
 * ids from the batch-update response. Callers still invalidate in the
 * background to reconcile with server truth.
 */
export function applyOptimisticShopItemEdits(
  client: QueryClient,
  { shopId, pendingEdits, pendingCategoryRenames, pendingNewCategories }: OptimisticVariables,
  createdCategories: readonly Category[],
): void {
  if (
    pendingEdits.size === 0 &&
    pendingCategoryRenames.size === 0 &&
    createdCategories.length === 0
  ) {
    return;
  }
  const draftIdToReal = reconcileCreatedCategories(pendingNewCategories, createdCategories);

  client.setQueriesData<InfiniteShopItemsData>(
    { queryKey: shopsKeys.itemsByShop(shopId) },
    (data) =>
      data ? applyEditsToPages(data, pendingEdits, pendingCategoryRenames, draftIdToReal) : data,
  );

  client.setQueryData<GetShopConfigResponse>(shopsKeys.configByShop(shopId), (config) =>
    config
      ? {
          ...config,
          categories: applyCategoryChanges(
            config.categories ?? [],
            pendingCategoryRenames,
            createdCategories,
          ),
        }
      : config,
  );
}
