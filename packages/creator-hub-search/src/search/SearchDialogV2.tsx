// NOTE (@neoxu, 2026-02-06): This file will be refactored in the next PR to split the logic into multiple files.
import React, { FunctionComponent, useCallback, useState, useEffect, useRef, useMemo } from 'react';
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
import { useTranslation } from '@rbx/intl';
import { useDebounce } from '@rbx/react-utilities';
import { useDocSiteSearchClient, DocSiteSearchResponse } from '../clients/docSiteSearch';
import useCurrentLocale from '../localization/hooks/useCurrentLocale';
import { DocumentationContentType } from '../clients/docSiteSearchType';
import { SearchFilterProvider, useSearchFilter } from '../contexts/SearchFilterContext';
import { useSearchConfig } from '../contexts/SearchConfigContext';
import throwError from '../utilities/error';
import { TUser } from './types/types';
import {
  TCategoryClearedInteraction,
  TCategoryClickedInteraction,
  trackSearchCategoryCleared,
  trackSearchCategoryClicked,
  trackSearchPerformed,
  trackSearchQueryCleared,
  trackSearchRecommendationClicked,
  trackSearchResultClicked,
  TResultClickedInteraction,
  isRealMouseClickEvent,
  TDialogClosedInteraction,
  isModifierKeyInteraction,
} from './searchEvents';
import { ESearchInteraction } from '../eventStream/enum/DocsSiteSearch';
import { isInteractKey } from '../layout/layout/utils/keyboardNavigationHandler';
import { isRecommendedSearchEnabled } from '../clients/recommendedSearchClient';
import useNavigationSearch from '../layout/topNavigation/hooks/useNavigationSearch';
import { TSearchResult } from './types/SearchResult';
import useSearchDialogStyles from './SearchDialogV2.styles';
import useSearchListItemStyles from './SearchListItem.styles';
import SearchListNullState from './SearchListNullState';
// import AskAssistant from "./AskAssistant";
import SearchContentV2 from './SearchContentV2';
import RecommendedSearch from './recommendations/RecommendedSearch';
import RecommendedSearchProvider from './recommendations/implementations/RecommendedSearchProvider';
import {
  DEFAULT_SEARCH_CATEGORY,
  DEFAULT_SEARCH_DISPLAY_CATEGORY,
  SEARCH_CATEGORIES,
  SEARCH_DISPLAY_CATEGORIES,
  LEARN_SUBCATEGORY_CHIPS,
  SearchCategory,
  SearchDisplayCategoryDef,
} from './utils/searchCategories';
import SearchLoadingSkeleton from './SearchLoadingSkeleton';
import {
  processSearchResults,
  processCreatorSearchResponse,
  ProcessedSearchData,
} from './utils/searchDataProcessing';
import { SvgIconKeyboardReturn, SvgIconSearch } from './searchIcons';
import {
  SEARCH_INPUT_ID,
  SearchableContainer,
  ESearchNavigationElement,
  searchNavigationDomQueries,
  useSearchNavigation,
} from './hooks/useSearchNavigation';
import { FilterChipsSection, DisplayCategoryChipsSection } from './SearchFilterChips';
import { TSearchListItem } from './types/SearchListItem';
import { EndAdornment, placeholderEndAdornment } from './SearchListItem';
import { getKeyboardShortcutKeys } from './utils/getSearchKeyboardShortcut';
import KeyLabel from './KeyLabel';

const SEARCH_DEBOUNCE_TIMER = 450;
// NOTE (@tchu, 2025-08-15): Add a delay to the loading timeout to avoid showing the loading state for a short time
const LOADING_TIMEOUT_DELAY = 300;
const NUM_RESULTS_TO_GET = 20;

// Module-level cache for search results
const searchCache: Record<string, TSearchResult[]> = {};

const getSavedResultsKey = (query: string, contentType: DocumentationContentType) => {
  return `${query}-${contentType}`;
};

interface SearchDialogV2Props {
  open: boolean;
  searchSessionId: string;
  user?: TUser | null;
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
  user,
}) => {
  const { translate } = useTranslation();
  const { urlLocale: locale } = useCurrentLocale();
  const { classes: listItemClasses } = useSearchListItemStyles({});
  const { setSearchDialogOpenWithEvent } = useNavigationSearch();
  const { currentProduct, eventLogger } = useSearchConfig();
  const creatorSearchClient = useDocSiteSearchClient();

  // Get display filter state from context
  const {
    displayFilter,
    subFilter,
    setDisplayFilter,
    setSubFilter,
    clearFilters,
    presetFilters,
    shouldShowFilterChips,
    shouldShowSubcategoryChips,
    isFilterDefault: isDisplayFilterDefault,
    maxResultsPerCategory,
  } = useSearchFilter();

  const searchInputRef = useRef<HTMLInputElement>(null);
  // Content type filter (Engine API, Cloud API, etc.) - used when subcategory is selected
  const [filter, setFilter] = useState<DocumentationContentType>(DEFAULT_SEARCH_CATEGORY);
  // When a display filter (Hub/Learn) is active but no subcategory is selected,
  // use the display filter value as the effective category for event tracking.
  const effectiveCategory: DocumentationContentType =
    filter !== DEFAULT_SEARCH_CATEGORY
      ? filter
      : (displayFilter as unknown as DocumentationContentType);
  const [inputQuery, setInputQuery] = useState<string>('');
  const debouncedInputQuery = useDebounce<string>(inputQuery, SEARCH_DEBOUNCE_TIMER);
  const [instantQuery, setInstantQuery] = useState<string | null>(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string>('');
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [isRecommended, setIsRecommended] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<TSearchResult[]>([]);

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

  let searchContentType: SearchContentType;

  if (isInputQueryEmpty || query.length === 0) {
    if (isContentTypeFilterDefault) {
      // Show null state (recently visited) when no query and no subcategory filter.
      // This includes: default (All), Hub selected, Learn selected (pre-set in /docs).
      searchContentType = SearchContentType.Null;
    } else {
      searchContentType = SearchContentType.Nothing;
    }
  } else if (isSearchLoading || (numberOfItems === 0 && lastSearchedQuery === '')) {
    searchContentType = SearchContentType.Loading;
  } else if (numberOfItems > 0) {
    searchContentType = SearchContentType.Items;
  } else {
    searchContentType = SearchContentType.EmptyResults;
  }

  const enableRecommendedSearch =
    isFilterDefault &&
    searchContentType !== SearchContentType.Loading &&
    isRecommendedSearchEnabled();

  const enableAskAssistant =
    isFilterDefault &&
    searchContentType !== SearchContentType.Loading &&
    numberOfItems > 0 &&
    process.env.enableSearchAskAssistant;

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
    return Object.values(resultsByContentType).flat();
  }, [resultsByContentType]);

  useEffect(() => {
    if (open) {
      presetFilters();
    }
  }, [open, presetFilters]);

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

      const savedResultsKey = getSavedResultsKey(query, filter);
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
        creatorSearchResponse = await creatorSearchClient.search(
          {
            locale,
            keyword: query,
            pageSize: NUM_RESULTS_TO_GET,
            documentationContentType: filter.toString(),
            searchSessionId,
          },
          user,
        );

        if (invalidated) return;

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
          locale,
          query,
          currentProduct,
          searchResults: Object.values(processedDataForTracking.resultsByContentType).flat(),
          searchSessionId,
        });
      } catch (e) {
        throwError(`SearchDialogV2: failed to fetch search results ${e}`);
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

    searchDocuments();

    return () => {
      invalidated = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter]);

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
        category: newFilter.value as unknown as DocumentationContentType,
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
      displayFilter,
      isDisplayFilterDefault,
      setDisplayFilter,
      isRecommended,
      locale,
      inputQuery,
      currentProduct,
      searchResults,
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
        category: newFilter.value as unknown as DocumentationContentType,
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
      clearFilters,
      isRecommended,
      locale,
      inputQuery,
      currentProduct,
      searchResults,
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
    if (isInteractKey(event)) {
      onClearFilter(currentFilter as SearchCategory, ESearchInteraction.KeyboardEnterCategoryPill);
    }
  };
  const onClickTopFilterChip = (event: React.MouseEvent<HTMLDivElement>) => {
    // NOTE (@tchu, 2025-08-28): keyboard enter is handled in `onKeyDownTopFilterChip`
    if (isRealMouseClickEvent(event)) {
      onClearFilter(currentFilter as SearchCategory, ESearchInteraction.ClickCategoryPill);
    }
  };

  // Handlers for display filter chip (Hub/Learn)
  const onKeyDownDisplayFilterChip = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractKey(event)) {
      onClearDisplayFilter(
        currentDisplayFilter as SearchDisplayCategoryDef,
        ESearchInteraction.KeyboardEnterCategoryPill,
      );
    }
  };
  const onClickDisplayFilterChip = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isRealMouseClickEvent(event)) {
      onClearDisplayFilter(
        currentDisplayFilter as SearchDisplayCategoryDef,
        ESearchInteraction.ClickCategoryPill,
      );
    }
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const TopFilterChip = () => {
    return (
      <Chip
        label={translate(`${currentFilter?.translationKey}`) || currentFilter?.fallbackLabel}
        className={classes.searchFilterChip}
        size='small'
        color='secondary'
        tabIndex={0}
        onClick={onClickTopFilterChip}
        onKeyDown={onKeyDownTopFilterChip}
        deleteIcon={<CloseIcon color='secondary' fontSize='small' />}
        // NOTE (@tchu, 2025-08-28): make the entire chip clickable instead of the delete icon
        // onDelete is not accessible by keyboard enter, so we only handle it in `onClick`
        onDelete={onClickTopFilterChip}
      />
    );
  };

  // eslint-disable-next-line react/no-unstable-nested-components
  const DisplayFilterChip = () => {
    return (
      <Chip
        label={
          translate(`${currentDisplayFilter?.translationKey}`) ||
          currentDisplayFilter?.fallbackLabel
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
  };

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
          <div className={classes.searchContainer} role='search'>
            <TextField
              label={null}
              fullWidth
              autoComplete='off'
              autoFocus
              id={SEARCH_INPUT_ID}
              placeholder={translate('Label.Search') || 'Search'}
              value={inputQuery}
              onChange={onSearchInput}
              onKeyDown={onKeyDown}
              inputRef={searchInputRef}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SvgIconSearch />
                    {hasDisplayFilter && <DisplayFilterChip />}
                    {hasContentTypeFilter && <TopFilterChip />}
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
              <Divider className={classes.searchDivider} role='separator' />
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
            item
            container
            direction='column'
            wrap='nowrap'
            data-list-container={SearchableContainer.List}
            className={classes.resultsContainer}>
            {searchContentType === SearchContentType.Items && (
              <SearchContentV2
                searchListItems={searchListItems}
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
              <React.Fragment>
                <Divider className={classes.searchDivider} role='separator' />
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
                      <React.Fragment>
                        {recommendations.map((recommendation) => (
                          <RecommendationListItem
                            key={recommendation}
                            recommendation={recommendation}
                            onClickRecommendation={onClickRecommendation}
                            listItemClasses={listItemClasses}
                            translate={translate}
                          />
                        ))}
                      </React.Fragment>
                    )}
                  />
                </List>
              </React.Fragment>
            )}

            {/* TODO(@neoxu, 2026-02-05): Need to refactor this to have FilterChipsSection component */}
            {enableFilterChips && (
              <React.Fragment>
                {!enableRecommendedSearch && (
                  <Divider className={classes.searchDivider} role='separator' />
                )}
                {renderFilterChipsSection()}
              </React.Fragment>
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
