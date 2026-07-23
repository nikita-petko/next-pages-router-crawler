// NOTE (@neoxu, 2026-02-06): This file will be refactored in the next PR to split the logic into multiple files.
import type { FunctionComponent } from 'react';
import React, { useCallback, useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useTranslation, useLocalization, Locale } from '@rbx/intl';
import { useDebounce } from '@rbx/react-utilities';
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  Typography,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  CloseIcon,
  List,
  Grid,
  ListItemSecondaryAction,
} from '@rbx/ui';
import type { DocSiteSearchResponse } from '../clients/docSiteSearch';
import { useDocSiteSearchClient } from '../clients/docSiteSearch';
import { DocumentationContentType, SearchDisplayCategory } from '../clients/docSiteSearchType';
import { isRecommendedSearchEnabled } from '../clients/recommendedSearchClient';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import { SearchFilterProvider, useSearchFilter } from '../contexts/SearchFilterContext';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import { isInteractKey } from '../layout/layout/utils/keyboardNavigationHandler';
import useNavigationSearch from '../layout/topNavigation/hooks/useNavigationSearch';
import throwError from '../utilities/error';
import {
  SEARCH_INPUT_ID,
  SearchableContainer,
  ESearchNavigationElement,
  searchNavigationDomQueries,
  useSearchNavigation,
} from './hooks/useSearchNavigation';
import { useStoreSearch } from './hooks/useStoreSearch';
import KeyLabel from './KeyLabel';
import RecommendedSearchProvider from './recommendations/implementations/RecommendedSearchProvider';
import RecommendedSearch from './recommendations/RecommendedSearch';
// import AskAssistant from "./AskAssistant";
import SearchContentV2 from './SearchContentV2';
import useSearchDialogStyles from './SearchDialogV2.styles';
import type {
  TCategoryClearedInteraction,
  TCategoryClickedInteraction,
  TResultClickedInteraction,
  TStoreNavClickedInteraction,
  TDialogClosedInteraction,
} from './searchEvents';
import {
  trackSearchCategoryCleared,
  trackSearchCategoryClicked,
  trackSearchInStoreClicked,
  trackSearchPerformed,
  trackSearchQueryCleared,
  trackSearchRecommendationClicked,
  trackSearchResultClicked,
  trackSearchStoreCategoryTileClicked,
  isRealMouseClickEvent,
  isModifierKeyInteraction,
} from './searchEvents';
import { FilterChipsSection, DisplayCategoryChipsSection } from './SearchFilterChips';
import { SvgIconKeyboardReturn, SvgIconSearch } from './searchIcons';
import { SearchInStoreItem } from './SearchInStoreItem';
import type { EndAdornment } from './SearchListItem';
import { placeholderEndAdornment } from './SearchListItem';
import useSearchListItemStyles from './SearchListItem.styles';
import SearchListNullState from './SearchListNullState';
import SearchLoadingSkeleton from './SearchLoadingSkeleton';
import type { StoreCategoryTileClick } from './StoreCategoryTilesSection';
import { StoreCategoryTilesSection } from './StoreCategoryTilesSection';
import type { TSearchListItem } from './types/SearchListItem';
import type { TSearchResult } from './types/SearchResult';
import { getKeyboardShortcutKeys } from './utils/getSearchKeyboardShortcut';
import type { SearchCategory, SearchDisplayCategoryDef } from './utils/searchCategories';
import {
  DEFAULT_SEARCH_CATEGORY,
  DEFAULT_SEARCH_DISPLAY_CATEGORY,
  SEARCH_CATEGORIES,
  SEARCH_DISPLAY_CATEGORIES,
} from './utils/searchCategories';
import type { ProcessedSearchData } from './utils/searchDataProcessing';
import { processSearchResults, processCreatorSearchResponse } from './utils/searchDataProcessing';

// useLayoutEffect resets scroll before paint (no flash) but warns during SSR;
// fall back to useEffect on the server where there's no layout to measure.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const SEARCH_DEBOUNCE_TIMER = 450;
// NOTE (@tchu, 2025-08-15): Add a delay to the loading timeout to avoid showing the loading state for a short time
const LOADING_TIMEOUT_DELAY = 300;
const NUM_RESULTS_TO_GET = 20;

// Module-level cache for search results
const searchCache: Record<string, TSearchResult[]> = {};

const getSavedResultsKey = (
  query: string,
  contentType: DocumentationContentType | SearchDisplayCategory,
) => {
  return `${query}-${contentType}`;
};

interface SearchDialogV2Props {
  open: boolean;
  searchSessionId: string;
}

enum SearchContentType {
  Null = 'null',
  Loading = 'loading',
  Items = 'items',
  EmptyResults = 'empty',
  Nothing = 'nothing',
}

const RecommendationListItem = React.memo<{
  recommendation: string;
  onClickRecommendation: (recommendation: string) => void;
  listItemClasses: Record<string, string>;
  translate: (key: string) => string;
}>(({ recommendation, onClickRecommendation, listItemClasses, translate }) => {
  const itemRef = useRef<HTMLLIElement>(null);
  const { onKeyDownSearch } = useSearchNavigation(itemRef);
  const [endAdornment, setEndAdornment] = useState<EndAdornment>(placeholderEndAdornment);

  const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (isInteractKey(e)) {
      onClickRecommendation(recommendation);
    } else {
      onKeyDownSearch(e);
    }
  };

  const onFocus = () => {
    setEndAdornment({
      Icon: SvgIconKeyboardReturn,
    });
  };

  const onBlur = () => {
    setEndAdornment(placeholderEndAdornment);
  };

  return (
    <ListItem
      key={recommendation}
      ref={itemRef}
      className={listItemClasses.listItem}
      tabIndex={0}
      data-search-navigation-element={ESearchNavigationElement.ListItem}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
      onClick={() => {
        onClickRecommendation(recommendation);
      }}>
      <ListItemIcon className={listItemClasses.listItemIcon} aria-hidden='true'>
        <SvgIconSearch />
      </ListItemIcon>
      <ListItemText
        className={listItemClasses.listItemText}
        primaryTypographyProps={{ color: 'inherit' }}
        primary={
          <Typography
            variant='body2'
            component='span'
            color='primary'
            aria-label={translate('Label.Title')}>
            {recommendation}
          </Typography>
        }
      />
      <ListItemSecondaryAction className={listItemClasses.listItemSecondaryAction}>
        <endAdornment.Icon fontSize='small' color='inherit' aria-hidden='true' />
      </ListItemSecondaryAction>
    </ListItem>
  );
});

RecommendationListItem.displayName = 'RecommendationListItem';

/**
 * Inner component that uses SearchFilterContext.
 * Wrapped by SearchFilterProvider in SearchDialogV2.
 */
const SearchDialogV2Inner: FunctionComponent<React.PropsWithChildren<SearchDialogV2Props>> = ({
  open,
  searchSessionId,
}) => {
  const { translate } = useTranslation();
  const { locale: userLocale } = useLocalization();
  const locale = userLocale ?? Locale.English;
  const { classes: listItemClasses } = useSearchListItemStyles({});
  const { setSearchDialogOpenWithEvent } = useNavigationSearch();
  const { currentProduct, eventLogger } = useSearchConfig();
  const creatorSearchClient = useDocSiteSearchClient();

  // Get display filter state from context
  const {
    displayFilter,
    setDisplayFilter,
    clearFilters,
    presetFilters,
    shouldShowFilterChips,
    shouldShowSubcategoryChips,
    isFilterDefault: isDisplayFilterDefault,
    maxResultsPerCategory,
  } = useSearchFilter();

  const searchInputRef = useRef<HTMLInputElement>(null);
  // Scrollable results container. Used to reset scroll to the top when the user
  // switches display category (Hub/Learn/Store) so they see the start of the
  // newly filtered list.
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const transitionProps = useMemo(() => ({ onEntered: () => searchInputRef.current?.focus() }), []);

  // Content type filter (Engine API, Cloud API, etc.) - used when subcategory is selected
  const [filter, setFilter] = useState<DocumentationContentType>(DEFAULT_SEARCH_CATEGORY);
  // When a display filter (Hub/Learn) is active but no subcategory is selected,
  // use the display filter value as the effective category for event tracking.
  const effectiveCategory: DocumentationContentType | SearchDisplayCategory =
    filter !== DEFAULT_SEARCH_CATEGORY ? filter : displayFilter;
  const [inputQuery, setInputQuery] = useState<string>('');
  const debouncedInputQuery = useDebounce<string>(inputQuery, SEARCH_DEBOUNCE_TIMER);
  const [instantQuery, setInstantQuery] = useState<string | null>(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string>('');
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [isRecommended, setIsRecommended] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<TSearchResult[]>([]);
  // Store (toolbox) results live in their own slice — they don't flow through
  // docSiteSearch's content-type pipeline.
  const { storeResults, isStoreLoading } = useStoreSearch({
    query: (instantQuery ?? debouncedInputQuery).trim(),
    isContentTypeFilterDefault: filter === DEFAULT_SEARCH_CATEGORY,
    isDisplayFilterDefault,
    displayFilter,
    searchSessionId,
    locale,
    translate,
  });

  // Derive processed data from searchResults and isFilterDefault via useMemo
  // so it recomputes when the display filter changes (Hub/Learn selected)
  // without needing to re-fetch from the backend.

  const searchListNullStateImpressionRef = useRef<string | null>(null);
  const recommendationImpressionRef = useRef<string | null>(null);
  // const askAssistantImpressionRef = useRef<string | null>(null);

  const query = (instantQuery ?? debouncedInputQuery).trim();

  // Whether the content type filter (Engine API, Cloud API, etc.) is at default
  const isContentTypeFilterDefault = filter === DEFAULT_SEARCH_CATEGORY;
  // Filter is default when both display filter and content type filter are default
  const isFilterDefault = isContentTypeFilterDefault && isDisplayFilterDefault;

  const effectiveDocumentationType = useMemo(() => {
    if (filter !== DEFAULT_SEARCH_CATEGORY) {
      return filter;
    }
    if (isDisplayFilterDefault) {
      return DEFAULT_SEARCH_CATEGORY;
    }
    if (displayFilter === SearchDisplayCategory.Hub) {
      return DocumentationContentType.CreatorHub;
    }
    if (displayFilter === SearchDisplayCategory.Learn) {
      return SearchDisplayCategory.Learn;
    }
    return DEFAULT_SEARCH_CATEGORY;
  }, [filter, displayFilter, isDisplayFilterDefault]);

  // When a specific subcategory is selected, show all results (no limit).
  // Otherwise use the context-driven limit (4 for All, 3 for Learn+docs, undefined otherwise).
  const effectiveMaxResultsPerCategory = isContentTypeFilterDefault
    ? maxResultsPerCategory
    : undefined;

  const { searchListItems, resultsByContentType, numberOfItems } = useMemo<ProcessedSearchData>(
    () => processSearchResults(searchResults, effectiveMaxResultsPerCategory),
    [searchResults, effectiveMaxResultsPerCategory],
  );

  const isInputQueryEmpty = inputQuery.length === 0;

  // Total item count across doc-site sections + Store section. Used to decide
  // between Loading / Items / EmptyResults so Store-only matches don't trigger
  // the empty state.
  const totalItemCount = numberOfItems + storeResults.length;

  let searchContentType: SearchContentType;

  if (isInputQueryEmpty || query.length === 0) {
    if (isContentTypeFilterDefault) {
      // Show null state (recently visited) when no query and no subcategory filter.
      // This includes: default (All), Hub selected, Learn selected (pre-set in /docs).
      searchContentType = SearchContentType.Null;
    } else {
      searchContentType = SearchContentType.Nothing;
    }
  } else if (totalItemCount > 0) {
    // Render available results immediately. A late-arriving loading flag (e.g.
    // the docs 300ms loading timeout firing after Store results have already
    // rendered) must not clobber on-screen results with the loading skeleton.
    searchContentType = SearchContentType.Items;
  } else if (isSearchLoading || isStoreLoading || lastSearchedQuery === '') {
    searchContentType = SearchContentType.Loading;
  } else {
    searchContentType = SearchContentType.EmptyResults;
  }

  const enableRecommendedSearch =
    isFilterDefault &&
    searchContentType !== SearchContentType.Loading &&
    isRecommendedSearchEnabled();

  // Show filter chips based on context state
  // - Default state: show Hub/Learn chips
  // - Hub selected: no chips
  // - Learn selected in non-docs: no chips
  // - Learn selected in docs (no subcategory): show subcategory chips
  // - Learn selected in docs + subcategory selected (e.g. Engine API): no chips
  const enableFilterChips =
    shouldShowFilterChips &&
    isContentTypeFilterDefault &&
    [SearchContentType.Null, SearchContentType.Items].includes(searchContentType);

  const { classes } = useSearchDialogStyles({
    isSearchContentNothing: searchContentType === SearchContentType.Nothing,
  });

  const searchResultsFromCategorized = useMemo(() => {
    const docResults = Object.values(resultsByContentType).flat();
    const storeRefs = storeResults
      .map((item) => item.resultRef)
      .filter((ref): ref is TSearchResult => Boolean(ref));
    if (displayFilter === SearchDisplayCategory.Store) {
      return storeRefs;
    }
    return [...docResults, ...storeRefs];
  }, [resultsByContentType, storeResults, displayFilter]);

  useEffect(() => {
    if (open) {
      presetFilters();
    }
  }, [open, presetFilters]);

  // When the display category changes (e.g. drilling into Store, Hub, or Learn),
  // reset the results list to the top. Otherwise the previous scroll offset is
  // preserved, which is especially noticeable for Store: its drilled-in view is
  // tall (it also renders the "Search in Store" row + category tiles), so a deep
  // scroll position from the grouped view stays valid and lands mid-list instead
  // of at the top of the filtered results.
  useIsomorphicLayoutEffect(() => {
    if (resultsContainerRef.current) {
      resultsContainerRef.current.scrollTop = 0;
    }
  }, [displayFilter]);

  useEffect(() => {
    if (inputQuery.length === 0) {
      React.startTransition(() => {
        setSearchResults([]);
        setLastSearchedQuery('');
        setIsSearchLoading(false);
      });
    }
  }, [inputQuery]);

  // Search effect
  useEffect(() => {
    setIsError(false);

    let invalidated = false;
    let timeoutId: NodeJS.Timeout;

    const searchDocuments = async () => {
      if (query.length === 0) {
        React.startTransition(() => {
          setSearchResults([]);
          setLastSearchedQuery('');
          setIsSearchLoading(false);
        });
        return;
      }

      const savedResultsKey = getSavedResultsKey(query, effectiveDocumentationType);
      if (savedResultsKey in searchCache) {
        const results = searchCache[savedResultsKey] ?? [];
        React.startTransition(() => {
          setSearchResults(results);
          setLastSearchedQuery(query);
          setIsSearchLoading(false);
        });
        return;
      }

      timeoutId = setTimeout(() => {
        setIsSearchLoading(true);
      }, LOADING_TIMEOUT_DELAY);

      let creatorSearchResponse: DocSiteSearchResponse;
      let processedResponse: TSearchResult[];

      try {
        creatorSearchResponse = await creatorSearchClient.search({
          locale,
          keyword: query,
          pageSize: NUM_RESULTS_TO_GET,
          documentationContentType: effectiveDocumentationType,
          searchSessionId,
        });

        if (invalidated) {
          return;
        }

        processedResponse = processCreatorSearchResponse(creatorSearchResponse, translate);
        const processedDataForTracking = processSearchResults(
          processedResponse,
          effectiveMaxResultsPerCategory,
        );
        trackSearchPerformed({
          eventLogger,
          category: effectiveCategory,
          interaction: ESearchInteraction.Input,
          isRecommended,
          isSemantic: !!creatorSearchResponse.isSemantic,
          isQueryUnderstandApplied: creatorSearchResponse.isQueryUnderstandApplied,
          locale,
          query,
          currentProduct,
          searchResults: Object.values(processedDataForTracking.resultsByContentType).flat(),
          searchSessionId,
        });
      } catch (e) {
        throwError(
          `SearchDialogV2: failed to fetch search results ${e instanceof Error ? e.message : String(e)}`,
        );
        setIsError(true);
        clearTimeout(timeoutId);
        React.startTransition(() => {
          setSearchResults([]);
          setLastSearchedQuery(query);
          setIsSearchLoading(false);
        });
        return;
      }

      clearTimeout(timeoutId);
      React.startTransition(() => {
        setIsError(creatorSearchResponse.isError);
        setSearchResults(processedResponse);
        setLastSearchedQuery(query);
        setIsSearchLoading(false);
      });

      // we shouldn't save error results
      if (!creatorSearchResponse.isError) {
        searchCache[savedResultsKey] = processedResponse;
      }
    };

    void searchDocuments();

    return () => {
      invalidated = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, effectiveDocumentationType]);

  useEffect(() => {
    if (instantQuery) {
      setInstantQuery(null);
    }
  }, [instantQuery]);

  const currentFilter: SearchCategory | undefined = SEARCH_CATEGORIES.find(
    (f) => f.value === filter,
  );

  // Current display filter (Hub/Learn)
  const currentDisplayFilter: SearchDisplayCategoryDef | undefined = SEARCH_DISPLAY_CATEGORIES.find(
    (f) => f.value === displayFilter,
  );

  // Handler for display category filter clicks (Hub/Learn)
  const onClickDisplayFilter = useCallback(
    (newFilter: SearchDisplayCategoryDef, interaction: TCategoryClickedInteraction): void => {
      searchInputRef.current?.focus();
      // Skip if the user already drilled into this category (avoids duplicate events).
      // Allow the click when in the default/grouped view so doc-site users can drill
      // into Learn even though Learn is their default display filter.
      if (newFilter.value === displayFilter && !isDisplayFilterDefault) {
        return;
      }
      setDisplayFilter(newFilter.value);
      setFilter(DEFAULT_SEARCH_CATEGORY);
      trackSearchCategoryClicked({
        eventLogger,
        category: newFilter.value,
        interaction,
        isRecommended,
        locale,
        query: inputQuery,
        currentProduct,
        searchResults: searchResultsFromCategorized,
        searchSessionId,
      });
    },
    [
      eventLogger,
      displayFilter,
      isDisplayFilterDefault,
      setDisplayFilter,
      isRecommended,
      locale,
      inputQuery,
      currentProduct,
      searchResultsFromCategorized,
      searchSessionId,
    ],
  );

  // Handler for clearing display filter
  const onClearDisplayFilter = useCallback(
    (newFilter: SearchDisplayCategoryDef, interaction: TCategoryClearedInteraction): void => {
      searchInputRef.current?.focus();
      if (newFilter.value === DEFAULT_SEARCH_DISPLAY_CATEGORY) {
        return;
      }
      clearFilters();
      setFilter(DEFAULT_SEARCH_CATEGORY);
      trackSearchCategoryCleared({
        eventLogger,
        category: newFilter.value,
        interaction,
        isRecommended,
        locale,
        query: inputQuery,
        currentProduct,
        searchResults: searchResultsFromCategorized,
        searchSessionId,
      });
    },
    [
      eventLogger,
      clearFilters,
      isRecommended,
      locale,
      inputQuery,
      currentProduct,
      searchResultsFromCategorized,
      searchSessionId,
    ],
  );

  const resetSearchDialog = useCallback((): void => {
    setInputQuery('');
    setFilter(DEFAULT_SEARCH_CATEGORY);
    clearFilters();
    searchInputRef.current?.focus();
  }, [setInputQuery, clearFilters]);

  const onClose = useCallback(
    (interaction: TDialogClosedInteraction): void => {
      resetSearchDialog();
      setIsRecommended(false);
      setSearchDialogOpenWithEvent({ searchDialogOpen: false, interaction });
    },
    [resetSearchDialog, setSearchDialogOpenWithEvent],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (isInputQueryEmpty && event.key === 'Backspace') {
        resetSearchDialog();
        trackSearchCategoryCleared({
          eventLogger,
          category: effectiveCategory,
          interaction: ESearchInteraction.KeyboardBackspace,
          isRecommended,
          locale,
          query: inputQuery,
          currentProduct,
          searchResults,
          searchSessionId,
        });
      } else if (event.key === 'ArrowDown') {
        // Navigate to the first search result item
        event.preventDefault();
        const firstSearchResult = searchNavigationDomQueries.getListItems()[0];
        if (firstSearchResult) {
          firstSearchResult.focus();
        }
      }
    },
    [
      eventLogger,
      effectiveCategory,
      inputQuery,
      isInputQueryEmpty,
      isRecommended,
      locale,
      resetSearchDialog,
      currentProduct,
      searchResults,
      searchSessionId,
    ],
  );

  const onClickFilter = useCallback(
    (newFilter: SearchCategory, interaction: TCategoryClickedInteraction): void => {
      searchInputRef.current?.focus();
      if (newFilter.value === filter) {
        return;
      }
      setFilter(newFilter.value);
      trackSearchCategoryClicked({
        eventLogger,
        category: newFilter.value,
        interaction,
        isRecommended,
        locale,
        query: inputQuery,
        currentProduct,
        searchResults,
        searchSessionId,
      });
    },
    [
      eventLogger,
      filter,
      isRecommended,
      locale,
      inputQuery,
      currentProduct,
      searchResults,
      searchSessionId,
    ],
  );

  const onClearFilter = useCallback(
    (newFilter: SearchCategory, interaction: TCategoryClearedInteraction): void => {
      searchInputRef.current?.focus();
      if (newFilter.value === DEFAULT_SEARCH_CATEGORY) {
        return;
      }
      setFilter(DEFAULT_SEARCH_CATEGORY);
      trackSearchCategoryCleared({
        eventLogger,
        category: newFilter.value,
        interaction,
        isRecommended,
        locale,
        query: inputQuery,
        currentProduct,
        searchResults,
        searchSessionId,
      });
    },
    [
      eventLogger,
      isRecommended,
      locale,
      inputQuery,
      currentProduct,
      searchResults,
      searchSessionId,
    ],
  );

  const onSearchInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      setInputQuery(event.target.value);
      setIsRecommended(false);
    },
    [],
  );

  const onClickItem = useCallback(
    (item: TSearchListItem, interaction: TResultClickedInteraction): void => {
      if (isModifierKeyInteraction(interaction)) {
        return;
      }
      onClose(ESearchInteraction.SearchCompleted);
    },
    [onClose],
  );

  const onClickContentItem = (item: TSearchListItem, interaction: TResultClickedInteraction) => {
    trackSearchResultClicked({
      eventLogger,
      category: effectiveCategory,
      interaction,
      isRecommended,
      locale,
      query: inputQuery,
      currentProduct,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      searchResult: item.resultRef!,
      searchResults: searchResultsFromCategorized,
      searchSessionId,
    });
    if (isModifierKeyInteraction(interaction)) {
      return;
    }
    onClose(ESearchInteraction.SearchCompleted);
  };

  // Store-navigation surfaces (Search-in-Store row + category tiles) fire their
  // own dedicated events and handle navigation themselves, so these callbacks
  // only log.
  const onClickSearchInStore = (href: string, interaction: TStoreNavClickedInteraction) => {
    trackSearchInStoreClicked({
      eventLogger,
      interaction,
      locale,
      query: inputQuery,
      currentProduct,
      searchSessionId,
      destinationUrl: href,
    });
  };

  const onClickStoreTile = (
    tile: StoreCategoryTileClick,
    interaction: TStoreNavClickedInteraction,
  ) => {
    trackSearchStoreCategoryTileClicked({
      eventLogger,
      interaction,
      locale,
      query: inputQuery,
      currentProduct,
      searchSessionId,
      categoryId: tile.id,
      categoryLabel: tile.label,
      positionIndex: tile.index,
      destinationUrl: tile.href,
    });
  };

  const onClickClearSearch = () => {
    trackSearchQueryCleared({
      eventLogger,
      category: effectiveCategory,
      interaction: ESearchInteraction.Click,
      isRecommended,
      locale,
      query: inputQuery,
      currentProduct,
      searchResults,
      searchSessionId,
    });
    resetSearchDialog();
  };

  const onClickRecommendation = (recommendation: string) => {
    setIsRecommended(true);
    setInstantQuery(recommendation);
    setInputQuery(recommendation);
    trackSearchRecommendationClicked({
      eventLogger,
      interaction: ESearchInteraction.Click,
      locale,
      query: inputQuery,
      recommendation,
      currentProduct,
      searchSessionId,
    });
  };

  // Handlers for content type filter chip (Engine API, Cloud API, etc.)
  const onKeyDownTopFilterChip = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractKey(event) && currentFilter) {
      onClearFilter(currentFilter, ESearchInteraction.KeyboardEnterCategoryPill);
    }
  };
  const onClickTopFilterChip = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isRealMouseClickEvent(event) && currentFilter) {
      onClearFilter(currentFilter, ESearchInteraction.ClickCategoryPill);
    }
  };

  // Handlers for display filter chip (Hub/Learn)
  const onKeyDownDisplayFilterChip = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractKey(event) && currentDisplayFilter) {
      onClearDisplayFilter(currentDisplayFilter, ESearchInteraction.KeyboardEnterCategoryPill);
    }
  };
  const onClickDisplayFilterChip = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isRealMouseClickEvent(event) && currentDisplayFilter) {
      onClearDisplayFilter(currentDisplayFilter, ESearchInteraction.ClickCategoryPill);
    }
  };

  const topFilterChip = (
    <Chip
      label={translate(`${currentFilter?.translationKey}`) || currentFilter?.fallbackLabel}
      className={classes.searchFilterChip}
      size='small'
      color='secondary'
      tabIndex={0}
      onClick={onClickTopFilterChip}
      onKeyDown={onKeyDownTopFilterChip}
      deleteIcon={<CloseIcon color='secondary' fontSize='small' />}
      onDelete={onClickTopFilterChip}
    />
  );

  const displayFilterChip = (
    <Chip
      label={
        translate(`${currentDisplayFilter?.translationKey}`) || currentDisplayFilter?.fallbackLabel
      }
      className={classes.searchFilterChip}
      size='small'
      color='secondary'
      tabIndex={0}
      onClick={onClickDisplayFilterChip}
      onKeyDown={onKeyDownDisplayFilterChip}
      deleteIcon={<CloseIcon color='secondary' fontSize='small' />}
      onDelete={onClickDisplayFilterChip}
    />
  );

  const renderFilterChipsSection = () => {
    if (isDisplayFilterDefault) {
      return <DisplayCategoryChipsSection onClickFilter={onClickDisplayFilter} />;
    }
    if (shouldShowSubcategoryChips) {
      return <FilterChipsSection onClickFilter={onClickFilter} />;
    }
    return null;
  };

  // Determine which chips to show in the input field
  const hasDisplayFilter = !isDisplayFilterDefault;
  const hasContentTypeFilter = filter !== DEFAULT_SEARCH_CATEGORY;

  return (
    <Dialog
      aria-label={translate('Label.Search')}
      open={open}
      TransitionProps={transitionProps}
      onClose={(_: unknown, reason: string) => {
        if (reason === 'escapeKeyDown') {
          onClose(ESearchInteraction.KeyboardEscape);
          return;
        }
        // currently only two reasons, 'escapeKeyDown' and 'backdropClick'
        onClose(ESearchInteraction.ModalClickOut);
      }}
      maxWidth='XXLarge'
      classes={{
        paper: classes.dialogPaper,
      }}>
      <RecommendedSearchProvider>
        <DialogContent className={classes.dialogContent}>
          <div className={classes.searchContainer}>
            <TextField
              label={null}
              fullWidth
              autoComplete='off'
              id={SEARCH_INPUT_ID}
              placeholder={translate('Label.Search') || 'Search'}
              value={inputQuery}
              onChange={onSearchInput}
              onKeyDown={onKeyDown}
              inputRef={searchInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start' className={classes.searchStartAdornment}>
                    <SvgIconSearch />
                    {hasDisplayFilter && displayFilterChip}
                    {hasContentTypeFilter && topFilterChip}
                  </InputAdornment>
                ),
                endAdornment:
                  hasDisplayFilter || hasContentTypeFilter || !isInputQueryEmpty ? (
                    <InputAdornment position='end'>
                      <IconButton
                        aria-label={translate('Label.ClearSearch') || 'Clear Search'}
                        size='small'
                        onClick={onClickClearSearch}>
                        <CloseIcon color='secondary' fontSize='small' />
                      </IconButton>
                    </InputAdornment>
                  ) : (
                    <InputAdornment position='end'>
                      <KeyLabel keys={getKeyboardShortcutKeys('K')} />
                    </InputAdornment>
                  ),
                inputProps: {
                  className: classes.searchInput,
                  'aria-label': `${translate('Label.Search')}. ${translate('Description.SearchScreenReaderHelpText')}`,
                },
                classes: {
                  root: classes.searchInputOutlineRoot,
                  notchedOutline: classes.searchInputOutline,
                },
              }}
            />
            {searchContentType !== SearchContentType.Nothing && (
              <Divider className={classes.searchDivider} />
            )}
          </div>

          {searchContentType === SearchContentType.Null && (
            <SearchListNullState
              impressionRef={searchListNullStateImpressionRef}
              onClickItem={onClickItem}
              locale={locale}
              searchSessionId={searchSessionId}
            />
          )}

          {searchContentType === SearchContentType.Loading && <SearchLoadingSkeleton />}

          {searchContentType === SearchContentType.EmptyResults && (
            <Grid item>
              <div className={classes.emptyResults}>
                {isError
                  ? translate('Label.ResultsErrorTryAgain')
                  : translate('Label.NoResultsFoundTryAgain')}
              </div>
            </Grid>
          )}

          <Grid
            ref={resultsContainerRef}
            item
            container
            direction='column'
            wrap='nowrap'
            data-list-container={SearchableContainer.List}
            className={classes.resultsContainer}>
            {searchContentType === SearchContentType.Items && (
              <SearchContentV2
                searchListItems={searchListItems}
                storeItems={storeResults}
                isContentTypeFilterDefault={isContentTypeFilterDefault}
                onClickItem={onClickContentItem}
                onClickFilter={onClickFilter}
                onClearFilter={onClearFilter}
                onClickDisplayFilter={onClickDisplayFilter}
                onClearDisplayFilter={onClearDisplayFilter}
                searchSessionId={searchSessionId}
                query={inputQuery}
              />
            )}
            {/* TODO(@neoxu, 2026-01-23): Add Ask Assistant back in */}
            {/* {enableAskAssistant && (
              <AskAssistant
                impressionRef={askAssistantImpressionRef}
                locale={locale}
                searchQuery={inputQuery}
                searchSessionId={searchSessionId}
                searchResults={searchResultsFromCategorized}
              />
            )} */}

            {/* TODO(@neoxu, 2026-02-05): Need to refactor this to have RecommendedSearch component */}
            {enableRecommendedSearch && (
              <>
                <Divider className={classes.searchDivider} />
                <List
                  className={classes.bottomSearchList}
                  data-list-container={SearchableContainer.List}
                  tabIndex={-1}>
                  <RecommendedSearch
                    locale={locale}
                    maxRecommendations={1}
                    impressionRef={recommendationImpressionRef}
                    searchQuery={inputQuery}
                    searchSessionId={searchSessionId}
                    renderRecommendations={({ recommendations }) => (
                      <>
                        {recommendations.map((recommendation) => (
                          <RecommendationListItem
                            key={recommendation}
                            recommendation={recommendation}
                            onClickRecommendation={onClickRecommendation}
                            listItemClasses={listItemClasses}
                            translate={translate}
                          />
                        ))}
                      </>
                    )}
                  />
                </List>
              </>
            )}

            {/* TODO(@neoxu, 2026-02-05): Need to refactor this to have FilterChipsSection component */}
            {enableFilterChips && (
              <>
                {!enableRecommendedSearch && <Divider className={classes.searchDivider} />}
                {renderFilterChipsSection()}
              </>
            )}

            {displayFilter === SearchDisplayCategory.Store &&
              searchContentType === SearchContentType.Items && (
                <>
                  {inputQuery.trim().length > 0 && (
                    <SearchInStoreItem query={inputQuery} onClickItem={onClickSearchInStore} />
                  )}
                  {!enableRecommendedSearch && <Divider className={classes.searchDivider} />}
                  <StoreCategoryTilesSection query={inputQuery} onClickItem={onClickStoreTile} />
                </>
              )}
          </Grid>
        </DialogContent>
      </RecommendedSearchProvider>
    </Dialog>
  );
};

/**
 * SearchDialogV2 wraps the inner component with SearchFilterProvider
 * to manage filter state. Filter state resets when dialog closes.
 */
const SearchDialogV2: FunctionComponent<React.PropsWithChildren<SearchDialogV2Props>> = (props) => {
  return (
    <SearchFilterProvider>
      <SearchDialogV2Inner {...props} />
    </SearchFilterProvider>
  );
};

export default SearchDialogV2;
