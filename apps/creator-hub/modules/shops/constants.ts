export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = ROWS_PER_PAGE_OPTIONS[0];

/** Upper bound on the number of items a single bulk action can target. */
export const BULK_SELECTION_LIMIT = 3000;

/** Maximum length (in characters) allowed for a shop category name. */
export const MAX_CATEGORY_NAME_LENGTH = 30;

/** Maximum number of categories a single shop can have. */
export const MAX_SHOP_CATEGORIES = 15;

// Name of the global shop icon "entry point" in the shops platform
export const GLOBAL_ICON_ENTRY_POINT_NAME = 'InExperienceGlobalIconEnabled';

/**
 * Query parameter set when navigating from the item catalog to an item's
 * configure page, so a "Back to Shop" backlink is rendered.
 */
export const FROM_SHOP = 'shop';
