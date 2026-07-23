import { DocumentationContentType, SearchDisplayCategory } from '../../clients/docSiteSearchType';

/**
 * Category definition for content type filtering (e.g., Engine API, Cloud API)
 */
export interface SearchCategory {
  value: DocumentationContentType;
  translationKey: string;
  fallbackLabel: string;
}

/**
 * Category definition for display category filtering (Hub, Learn)
 */
export interface SearchDisplayCategoryDef {
  value: SearchDisplayCategory;
  translationKey: string;
  fallbackLabel: string;
}

export const DEFAULT_SEARCH_CATEGORY = DocumentationContentType.All;
export const DEFAULT_SEARCH_DISPLAY_CATEGORY = SearchDisplayCategory.All;

/**
 * High-level display categories shown at the bottom of search dialog.
 * Hub = CreatorHub pages, Learn = Documentation content
 */
export const SEARCH_DISPLAY_CATEGORIES: readonly SearchDisplayCategoryDef[] = [
  {
    value: SearchDisplayCategory.Hub,
    translationKey: 'Label.Hub',
    fallbackLabel: 'Hub',
  },
  {
    value: SearchDisplayCategory.Learn,
    translationKey: 'Label.Learn',
    fallbackLabel: 'Learn',
  },
  {
    value: SearchDisplayCategory.Store,
    translationKey: 'Label.Store',
    fallbackLabel: 'Store',
  },
];

/**
 * Subcategory chips shown when Learn is selected in /docs context.
 * These are the fine-grained content type filters.
 */
export const LEARN_SUBCATEGORY_CHIPS: readonly SearchCategory[] = [
  {
    value: DocumentationContentType.LuaAPI,
    translationKey: 'Label.EngineAPI',
    fallbackLabel: 'Engine API',
  },
  {
    value: DocumentationContentType.CloudAPI,
    translationKey: 'Label.CloudAPI',
    fallbackLabel: 'Cloud API',
  },
  {
    value: DocumentationContentType.Article,
    translationKey: 'Label.Articles',
    fallbackLabel: 'Articles',
  },
  {
    value: DocumentationContentType.Video,
    translationKey: 'Label.Videos',
    fallbackLabel: 'Videos',
  },
  {
    value: DocumentationContentType.DevForum,
    translationKey: 'Label.DevForum',
    fallbackLabel: 'Forum',
  },
];

/**
 * Use SEARCH_DISPLAY_CATEGORIES for Hub/Learn filtering
 * or LEARN_SUBCATEGORY_CHIPS for subcategory filtering.
 * Kept for backward compatibility during migration.
 */
export const SEARCH_CATEGORIES: readonly SearchCategory[] = [
  {
    value: DocumentationContentType.CreatorHub,
    translationKey: 'Label.Pages',
    fallbackLabel: 'Pages',
  },
  ...LEARN_SUBCATEGORY_CHIPS,
];
