import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TCategoryClearedInteraction, TCategoryClickedInteraction } from './searchEvents';
import {
  SEARCH_DISPLAY_CATEGORIES,
  LEARN_SUBCATEGORY_CHIPS,
  SearchCategory,
  SearchDisplayCategoryDef,
} from './utils/searchCategories';
import { SearchList } from './SearchList';
import { TSearchListItem } from './types/SearchListItem';
import { SearchListItemLinkWrapperProps } from './SearchListItem';
import useRecommendedSearch from './recommendations/hooks/useRecommendedSearch';
import { useSearchFilter } from '../contexts/SearchFilterContext';
import { SearchDisplayCategory, getDisplayCategory } from '../clients/docSiteSearchType';

interface SearchContentProps {
  /** Whether the content type filter (Engine API, Cloud API, etc.) is at default (no subcategory selected) */
  isContentTypeFilterDefault: boolean;
  searchListItems: Record<string, TSearchListItem[]>;
  onClickItem: SearchListItemLinkWrapperProps['onClickItem'];
  onClickFilter?: (filter: SearchCategory, interaction: TCategoryClickedInteraction) => void;
  onClearFilter?: (filter: SearchCategory, interaction: TCategoryClearedInteraction) => void;
  onClickDisplayFilter?: (
    filter: SearchDisplayCategoryDef,
    interaction: TCategoryClickedInteraction,
  ) => void;
  onClearDisplayFilter?: (
    filter: SearchDisplayCategoryDef,
    interaction: TCategoryClearedInteraction,
  ) => void;
  searchSessionId?: string;
  query?: string;
}

const SearchContentV2: FunctionComponent<React.PropsWithChildren<SearchContentProps>> = ({
  isContentTypeFilterDefault,
  searchListItems,
  onClickItem,
  onClickFilter,
  onClearFilter,
  onClickDisplayFilter,
  onClearDisplayFilter,
  searchSessionId,
  query,
}) => {
  const { setExclusions: setDoNotRecommendArray } = useRecommendedSearch();
  const { translate } = useTranslation();
  const {
    displayFilter,
    isFilterDefault: isDisplayFilterDefault,
    isDocSiteContext,
    maxResultsPerCategory,
  } = useSearchFilter();

  // Update recommendations when search results change
  useEffect(() => {
    const allResults = Object.values(searchListItems).flat();
    setDoNotRecommendArray(allResults.map((item) => item.title));
  }, [searchListItems, setDoNotRecommendArray]);

  // Group items by display category (Hub/Learn)
  const itemsByDisplayCategory = useMemo(() => {
    const allItems = Object.values(searchListItems).flat();
    return allItems.reduce(
      (acc, item) => {
        const category = getDisplayCategory(item.documentationContentType ?? null);
        acc[category] = [...(acc[category] || []), item];
        return acc;
      },
      {} as Record<SearchDisplayCategory, TSearchListItem[]>,
    );
  }, [searchListItems]);

  // Memoize the content types to avoid recalculating on every render
  const contentTypes = useMemo(() => Object.keys(searchListItems), [searchListItems]);

  // Memoize the category mapping to avoid repeated find operations
  const categoryMap = useMemo(() => {
    return contentTypes.reduce(
      (acc, contentType) => {
        // Use LEARN_SUBCATEGORY_CHIPS for Learn categories (excludes Pages)
        const category = LEARN_SUBCATEGORY_CHIPS.find((cat) => cat.value === contentType);
        if (category) {
          acc[contentType] = category;
        }
        return acc;
      },
      {} as Record<string, SearchCategory>,
    );
  }, [contentTypes]);

  const impressionContext = searchSessionId && query ? { searchSessionId, query } : undefined;

  const allResultsLabel =
    displayFilter === SearchDisplayCategory.Learn && isDocSiteContext
      ? (translate('Label.AllLearnResults') as string) || 'All Learn Results'
      : undefined;

  // Render content based on current filter state
  const renderContent = () => {
    // When display filter is default (no Hub/Learn selected), show grouped by Hub/Learn
    if (isDisplayFilterDefault) {
      const displayCategories = Object.keys(itemsByDisplayCategory) as SearchDisplayCategory[];

      return displayCategories.map((displayCategory) => {
        const allItems = itemsByDisplayCategory[displayCategory];
        const displayCategoryDef = SEARCH_DISPLAY_CATEGORIES.find(
          (cat) => cat.value === displayCategory,
        );

        if (!displayCategoryDef || !allItems || allItems.length === 0) {
          return null;
        }

        // Limit items per display category (Hub/Learn) in grouped view
        const items = maxResultsPerCategory ? allItems.slice(0, maxResultsPerCategory) : allItems;

        return (
          <SearchList
            key={displayCategory}
            isTitleClickable
            items={items}
            title={translate(displayCategoryDef.translationKey) || displayCategoryDef.fallbackLabel}
            onClickItem={onClickItem}
            onClickTitle={(interaction) => onClickDisplayFilter?.(displayCategoryDef, interaction)}
            showAllResultsButton={false}
            impressionContext={impressionContext}
          />
        );
      });
    }

    // When Hub is selected, show Hub results only with "< All Results" back button
    if (displayFilter === SearchDisplayCategory.Hub) {
      const hubItems = itemsByDisplayCategory[SearchDisplayCategory.Hub] || [];
      const hubCategoryDef = SEARCH_DISPLAY_CATEGORIES.find(
        (cat) => cat.value === SearchDisplayCategory.Hub,
      );

      if (hubItems.length === 0) {
        return null;
      }

      return (
        <SearchList
          key='hub'
          isTitleClickable
          items={hubItems}
          title={
            translate(hubCategoryDef?.translationKey ?? 'Label.Hub') ||
            hubCategoryDef?.fallbackLabel ||
            'Hub'
          }
          onClickItem={onClickItem}
          onClearFilter={
            hubCategoryDef
              ? (interaction) => onClearDisplayFilter?.(hubCategoryDef, interaction)
              : undefined
          }
          showAllResultsButton
          impressionContext={impressionContext}
        />
      );
    }

    // When Learn is selected
    if (displayFilter === SearchDisplayCategory.Learn) {
      // In doc-site context: show Learn items grouped by subcategory
      if (isDocSiteContext) {
        return contentTypes.map((contentType) => {
          const items = searchListItems[contentType];
          const category = categoryMap[contentType];

          // Skip CreatorHub items (they belong to Hub, not Learn)
          if (!category || !items) {
            return null;
          }

          return (
            <SearchList
              key={contentType}
              isTitleClickable
              items={items}
              title={translate(category.translationKey) || category.fallbackLabel}
              onClickItem={onClickItem}
              onClickTitle={(interaction) => onClickFilter?.(category, interaction)}
              onClearFilter={(interaction) => onClearFilter?.(category, interaction)}
              showAllResultsButton={!isContentTypeFilterDefault}
              allResultsLabel={allResultsLabel}
              impressionContext={impressionContext}
            />
          );
        });
      }

      // In non-doc-site context: show Learn items as flat list with "< All Results" back button
      const learnItems = itemsByDisplayCategory[SearchDisplayCategory.Learn] || [];
      const learnCategoryDef = SEARCH_DISPLAY_CATEGORIES.find(
        (cat) => cat.value === SearchDisplayCategory.Learn,
      );

      if (learnItems.length === 0) {
        return null;
      }

      return (
        <SearchList
          key='learn'
          isTitleClickable
          items={learnItems}
          title={
            translate(learnCategoryDef?.translationKey ?? 'Label.Learn') ||
            learnCategoryDef?.fallbackLabel ||
            'Learn'
          }
          onClickItem={onClickItem}
          onClearFilter={
            learnCategoryDef
              ? (interaction) => onClearDisplayFilter?.(learnCategoryDef, interaction)
              : undefined
          }
          showAllResultsButton
          impressionContext={impressionContext}
        />
      );
    }

    // Fallback: show by content type (original behavior)
    return contentTypes.map((contentType) => {
      const items = searchListItems[contentType];
      const category = categoryMap[contentType];
      return category && items ? (
        <SearchList
          key={contentType}
          isTitleClickable
          items={items}
          title={translate(category.translationKey)}
          onClickItem={onClickItem}
          onClickTitle={(interaction) => onClickFilter?.(category, interaction)}
          onClearFilter={(interaction) => onClearFilter?.(category, interaction)}
          showAllResultsButton={!isContentTypeFilterDefault}
          impressionContext={impressionContext}
        />
      ) : null;
    });
  };

  return <React.Fragment>{renderContent()}</React.Fragment>;
};

export default SearchContentV2;
