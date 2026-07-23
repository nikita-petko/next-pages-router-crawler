import {
  DocumentationContentType,
  SearchDisplayCategory,
  getDisplayCategory,
} from '../../clients/docSiteSearchType';
import { NavigationTypeRaw } from '../../utilities/pageBuild/types/NavigationRaw';
import { parseTitleBreadcrumb } from '../searchListItemUtils';
import {
  DocSiteSearchResponse,
  getTranslatedCategoryDisplayText,
  getCategoryTranslationLabels,
} from '../../clients/docSiteSearch';
import { isDeprecatedTag } from '../../apiReference/page/sharedUI/utils/tagUtils';
import {
  TCategorizedSearchResults,
  TCategorizedSearchResultsByDisplay,
  TSearchResult,
} from '../types/SearchResult';
import {
  TCategorizedSearchListItems,
  TCategorizedSearchListItemsByDisplay,
  TSearchListItem,
} from '../types/SearchListItem';

export const processCreatorSearchResponse = (
  response: DocSiteSearchResponse,
  translate: (key: string, args?: Record<string, string>) => string,
): TSearchResult[] => {
  if (!response.results) {
    return [];
  }
  return response.results.map((result) => ({
    searchSessionId: response.searchSessionId || '',
    title: result.highlightedTitle || result.title || '',
    description: result.highlightedDisplayedSummary || result.displayedSummary || '',
    url: result.url || '',
    category: getTranslatedCategoryDisplayText(result, translate) || '',
    documentationContentType: result.documentationContentType,
    documentationSubType: result.documentationSubType,
    documentationThirdType: result.documentationThirdType,
    categoryTranslationLabels: getCategoryTranslationLabels(result),
    deprecated:
      ((result.documentationContentType === DocumentationContentType.LuaAPI ||
        result.documentationContentType === DocumentationContentType.CloudAPI) &&
        result.tags?.some(isDeprecatedTag)) ??
      false,
    isSemantic: response.isSemantic ?? false,
    createdAtUtc: result.createdAtUtc || '',
    updatedAtUtc: result.updatedAtUtc || '',
    views: result.views,
    clicks: result.clicks,
    author: result.author,
    entityId: result.entityId,
    breadcrumb: result.breadcrumb ?? '',
    experienceName: result.experienceName,
    creatorName: result.creatorName,
  }));
};

export interface ProcessedSearchData {
  resultsByContentType: TCategorizedSearchResults;
  searchListItems: TCategorizedSearchListItems;
  numberOfCategories: number;
  numberOfItems: number;
  maxItemsPerCategory?: number;
}

export const convertToSearchListItems = (results: TSearchResult[]): TSearchListItem[] => {
  return results.map((result) => {
    const contentType = result.documentationContentType;
    let type: NavigationTypeRaw;
    if (contentType === DocumentationContentType.LuaAPI) {
      type = NavigationTypeRaw.EngineAPI;
    } else if (contentType === DocumentationContentType.CloudAPI) {
      type = NavigationTypeRaw.CloudAPI;
    } else if (contentType === DocumentationContentType.DevForum) {
      type = NavigationTypeRaw.Forum;
    } else if (contentType === DocumentationContentType.Video) {
      type = NavigationTypeRaw.Videos;
    } else if (contentType === DocumentationContentType.Article) {
      type = NavigationTypeRaw.Markdown;
    } else {
      // Default to Markdown for unknown/null content types
      type = NavigationTypeRaw.Markdown;
    }

    const isCreatorHub = contentType === DocumentationContentType.CreatorHub;

    // For CreatorHub items the title may contain breadcrumb segments
    // (e.g. " Analytics / Custom Events"). Parse into display title + breadcrumb,
    // preferring the title-derived breadcrumb and falling back to the index breadcrumb field.
    const { displayTitle, hubBreadcrumb: titleBreadcrumb } = isCreatorHub
      ? parseTitleBreadcrumb(result.title)
      : { displayTitle: result.title, hubBreadcrumb: undefined };

    const entityName = isCreatorHub ? result.experienceName : undefined;
    const hubBreadcrumb = isCreatorHub
      ? (titleBreadcrumb ?? (result.breadcrumb || undefined))
      : undefined;
    const authorName = isCreatorHub ? result.creatorName : undefined;

    return {
      ...result,
      title: displayTitle,
      translatedCategoryDisplayText: result.category, // TODO: Search Package. Update to correct Logic
      id: result.url,
      path: result.url,
      resultRef: result,
      type,
      createdAtUtc: result.createdAtUtc,
      updatedAtUtc: result.updatedAtUtc,
      entityName,
      hubBreadcrumb,
      authorName,
    };
  });
};

/**
 * Processes search results by grouping them into content type categories
 * and optionally limiting the number of results per category.
 *
 * @param searchResults - Raw search results to process
 * @param maxResultsPerCategory - Max results per category in grouped views.
 *   Pass a number to limit (e.g. 4 for All state, 3 for Learn+docs).
 *   Pass undefined to show all results (e.g. when a specific category is selected).
 */
export const processSearchResults = (
  searchResults: TSearchResult[],
  maxResultsPerCategory?: number,
): ProcessedSearchData => {
  // Process search results by content type
  const allResultsByContentType =
    searchResults.length === 0
      ? ({} as TCategorizedSearchResults)
      : searchResults.reduce((acc, result) => {
          const contentType = result.documentationContentType ?? DocumentationContentType.Article;
          acc[contentType] = [...(acc[contentType] || []), result];
          return acc;
        }, {} as TCategorizedSearchResults);

  const numberOfCategories = Object.keys(allResultsByContentType).length;
  const maxItemsPerCategory =
    maxResultsPerCategory != null && numberOfCategories > 1 ? maxResultsPerCategory : undefined;

  // limit cardinality of each category to maxResultsPerCategory
  const resultsByContentType = Object.fromEntries(
    Object.entries(allResultsByContentType).map(([contentType, allResults]) => [
      contentType,
      allResults.slice(0, maxItemsPerCategory),
    ]),
  ) as TCategorizedSearchResults;

  // Convert results to list items
  const searchListItems =
    Object.keys(resultsByContentType).length === 0
      ? ({} as TCategorizedSearchListItems)
      : (Object.keys(allResultsByContentType) as DocumentationContentType[]).reduce(
          (acc, contentType) => {
            const results = resultsByContentType[contentType];
            acc[contentType] = convertToSearchListItems(results);
            return acc;
          },
          {} as TCategorizedSearchListItems,
        );

  const numberOfItems = Object.values(searchListItems).reduce(
    (sum, items) => sum + items.length,
    0,
  );

  return {
    resultsByContentType,
    searchListItems,
    numberOfCategories,
    numberOfItems,
  };
};

/**
 * Groups search results by display category (Hub/Learn).
 * Hub = CreatorHub pages, Learn = everything else (Engine API, Cloud API, Articles, Videos, DevForum)
 */
export const groupResultsByDisplayCategory = (
  results: TSearchResult[],
): TCategorizedSearchResultsByDisplay => {
  if (results.length === 0) {
    return {} as TCategorizedSearchResultsByDisplay;
  }

  return results.reduce((acc, result) => {
    const displayCategory = getDisplayCategory(result.documentationContentType);
    acc[displayCategory] = [...(acc[displayCategory] || []), result];
    return acc;
  }, {} as TCategorizedSearchResultsByDisplay);
};

/**
 * Groups search list items by display category (Hub/Learn).
 */
export const groupListItemsByDisplayCategory = (
  items: TSearchListItem[],
): TCategorizedSearchListItemsByDisplay => {
  if (items.length === 0) {
    return {} as TCategorizedSearchListItemsByDisplay;
  }

  return items.reduce((acc, item) => {
    const displayCategory = getDisplayCategory(item.documentationContentType ?? null);
    acc[displayCategory] = [...(acc[displayCategory] || []), item];
    return acc;
  }, {} as TCategorizedSearchListItemsByDisplay);
};

/**
 * Filters search results by display category.
 * @param results - All search results
 * @param displayCategory - The display category to filter by (Hub/Learn)
 * @returns Filtered results for the specified display category
 */
export const filterResultsByDisplayCategory = (
  results: TSearchResult[],
  displayCategory: SearchDisplayCategory,
): TSearchResult[] => {
  if (displayCategory === SearchDisplayCategory.All) {
    return results;
  }

  return results.filter(
    (result) => getDisplayCategory(result.documentationContentType) === displayCategory,
  );
};

/**
 * Filters search list items by display category.
 */
export const filterListItemsByDisplayCategory = (
  items: TSearchListItem[],
  displayCategory: SearchDisplayCategory,
): TSearchListItem[] => {
  if (displayCategory === SearchDisplayCategory.All) {
    return items;
  }

  return items.filter(
    (item) => getDisplayCategory(item.documentationContentType ?? null) === displayCategory,
  );
};
