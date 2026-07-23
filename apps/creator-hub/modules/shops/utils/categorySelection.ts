import type { Category, ItemIdentifier } from '@rbx/client-shops-api/v1';
import { MAX_SHOP_CATEGORIES } from '../constants';
import type { ShopItemEdit } from '../item-catalog/hooks/usePendingShopItemEdits';
import type { PendingShopItemEdits } from '../item-catalog/utils/transformBatchUpdateShopItemsRequest';

/** A resolved category choice from a create-item category combobox. */
export type CategorySelection =
  | { type: 'existing'; category: Category }
  | { type: 'new'; name: string };

// Client-only draft category id prefix
const DRAFT_CATEGORY_PREFIX = 'draft:';

/** Case-insensitive lookup of an existing category by display name. */
export function findCategoryByName(
  categories: readonly Category[],
  name: string,
): Category | undefined {
  const normalized = name.trim().toLowerCase();
  return categories.find((category) => category.name.toLowerCase() === normalized);
}

/**
 * True when the typed name would create a new category but the shop has already
 * reached its category cap. Assigning an existing category stays allowed.
 */
export function isNewCategoryOverLimit(
  name: string | null,
  categories: readonly Category[],
): boolean {
  if (name === null) {
    return false;
  }
  const trimmed = name.trim();
  return (
    trimmed.length > 0 &&
    !findCategoryByName(categories, trimmed) &&
    categories.length >= MAX_SHOP_CATEGORIES
  );
}

/**
 * Resolves a typed category name against the shop's registry: an existing
 * match assigns that category, a brand-new name creates one (unless the shop
 * is at its category cap), and an empty/at-limit input resolves to nothing.
 */
export function resolveCategorySelection(
  name: string,
  categories: readonly Category[],
): CategorySelection | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const matchingCategory = findCategoryByName(categories, trimmed);
  if (matchingCategory) {
    return { type: 'existing', category: matchingCategory };
  }

  if (categories.length >= MAX_SHOP_CATEGORIES) {
    return null;
  }

  return { type: 'new', name: trimmed };
}

/**
 * Builds the single-item `PendingShopItemEdits` that assigns a freshly created
 * shop item to a category. Existing categories go out as item category updates;
 * a new category is staged under a draft id so the batch-update transform routes
 * it into `createdCategories`.
 */
export function buildNewItemCategoryEdits(
  item: ItemIdentifier,
  selection: CategorySelection,
): PendingShopItemEdits {
  const key = `${item.type}-${item.id}`;
  const noRenames: ReadonlyMap<string, string> = new Map();

  if (selection.type === 'existing') {
    return {
      pendingEdits: new Map<string, ShopItemEdit>([[key, { category: selection.category }]]),
      pendingCategoryRenames: noRenames,
      pendingNewCategories: new Map<string, Category>(),
    };
  }

  const draftCategory: Category = {
    id: `${DRAFT_CATEGORY_PREFIX}${crypto.randomUUID()}`,
    name: selection.name,
  };
  return {
    pendingEdits: new Map<string, ShopItemEdit>([[key, { category: draftCategory }]]),
    pendingCategoryRenames: noRenames,
    pendingNewCategories: new Map<string, Category>([[draftCategory.id, draftCategory]]),
  };
}
