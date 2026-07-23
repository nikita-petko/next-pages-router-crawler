import type {
  BatchUpdateShopItemsRequest,
  Category,
  CategoryRename,
  CreatedCategory,
  ItemCategoryUpdate,
  ItemIdentifier,
  ItemVisibilityUpdate,
} from '@rbx/client-shops-api/v1';
import { parseShopItemKey } from '../../types';
import type { ShopItemEdit } from '../hooks/usePendingShopItemEdits';

export type PendingShopItemEdits = {
  pendingEdits: ReadonlyMap<string, ShopItemEdit>;
  pendingCategoryRenames: ReadonlyMap<string, string>;
  pendingNewCategories: ReadonlyMap<string, Category>;
};

/**
 * Converts the local edit state from `usePendingShopItemEdits` into a
 * `BatchUpdateShopItemsRequest`. All edits are grouped by override type (item
 * visibility, item category, category rename, category creation).
 */
export function transformBatchUpdateShopItemsRequest({
  pendingEdits,
  pendingCategoryRenames,
  pendingNewCategories,
}: PendingShopItemEdits): BatchUpdateShopItemsRequest {
  const itemVisibilityUpdates: ItemVisibilityUpdate[] = [];
  const itemCategoryUpdates: ItemCategoryUpdate[] = [];
  const createdCategoryItems = new Map<string, ItemIdentifier[]>();

  for (const [key, edit] of pendingEdits) {
    const identifier = parseShopItemKey(key);
    if (!identifier) {
      continue;
    }

    if (edit.isVisibleInShop !== undefined) {
      itemVisibilityUpdates.push({ item: identifier, isVisibleInShop: edit.isVisibleInShop });
    }

    if (edit.category !== undefined) {
      // Draft categories use randomly generated client-side ids (UI-only, never
      // sent to the backend); their items route into the createdCategories
      // bucket, while server-known category ids go out as itemCategoryUpdates.
      if (pendingNewCategories.has(edit.category.id)) {
        const bucket = createdCategoryItems.get(edit.category.id);
        if (bucket) {
          bucket.push(identifier);
        } else {
          createdCategoryItems.set(edit.category.id, [identifier]);
        }
      } else {
        itemCategoryUpdates.push({ item: identifier, categoryId: edit.category.id });
      }
    }
  }

  const categoryRenames: CategoryRename[] = [];
  for (const [categoryId, newName] of pendingCategoryRenames) {
    categoryRenames.push({ categoryId, newName });
  }

  // Empty new categories are omitted: with no assigned items they get no
  // bucket, and the backend ignores them anyway.
  const createdCategories: CreatedCategory[] = [];
  for (const [draftId, category] of pendingNewCategories) {
    const categoryItems = createdCategoryItems.get(draftId);
    if (!categoryItems) {
      continue;
    }
    createdCategories.push({ name: category.name, items: categoryItems });
  }

  const request: BatchUpdateShopItemsRequest = {};
  if (itemVisibilityUpdates.length > 0) {
    request.itemVisibilityUpdates = itemVisibilityUpdates;
  }
  if (itemCategoryUpdates.length > 0) {
    request.itemCategoryUpdates = itemCategoryUpdates;
  }
  if (categoryRenames.length > 0) {
    request.categoryRenames = categoryRenames;
  }
  if (createdCategories.length > 0) {
    request.createdCategories = createdCategories;
  }
  return request;
}
