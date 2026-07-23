import { FormattedText } from '@modules/analytics-translations';
import { PageLoading } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ClaimItemDiscoveredFromEnum, ErrorResponseAppErrorCodeEnum } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Chip, CircularProgress, Grid, useDialog, useMediaQuery, useTheme } from '@rbx/ui';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import { FetchNextPageOptions } from '@tanstack/react-query';
import BeginSearchState from './BeginSearchState';
import CartDrawer from './CartDrawer';
import { ENUM_GROUPS, getCategoryTLKey, SearchSource, SearchType } from './SearchEnums';
import SearchResultsScrollView from './SearchResultsScrollView';
import SearchExpiredDialog from './SearchExpiredDialog';
import SearchFilterButton from './SearchFilterButton';
import SearchFilterGroups from './SearchFilterGroups';
import SearchFooter from './SearchFooter';
import SearchInput from './SearchInput';
import useCart from './useCart';
import useInitalLocalStorage from './useInitialLocalStorage';
import useSearchQuery from './useSearchQuery';
import useSubmitImage from './useSubmitImage';
import Match from './Match';
import {
  RMCreateClaimFeatureName,
  useGetRightsFeatureTimeoutIntervention,
} from '../../hooks/useInterventions';
import ClaimCreationRestrictionBanner from '../error/ClaimCreationRestrictionBanner';
import { useCurrentAccountContext } from '../../../components/AccountProvider';

const LOCAL_STORAGE_SEARCH_TEXTS_KEY = 'rightsSearchTexts';
const LOCAL_STORAGE_SEARCH_TEXTS_VERSION = '1';
const SEARCH_HISTORY_LENGTH = 5;

function deserializeSearchHistory(item: unknown): string[] {
  if (!Array.isArray(item) || item.some((i) => typeof i !== 'string')) {
    throw new TypeError('item is not an array of strings');
  }
  return item;
}

interface SearchContainerProps {
  onSubmit: (content: Match[]) => void;
  cart: ReturnType<typeof useCart>;
  currentSource: SearchSource;
}

interface SearchSubmission {
  searchText: string;
  searchType: SearchType;
  imageId: string;
}

// SearchContainer contains the search page, which includes avatar and development tabs
const SearchContainer = ({ onSubmit, cart, currentSource }: SearchContainerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('Medium'));
  const { ready, translate } = useTranslation();
  const [image, setImage] = useState<File | undefined>();
  const { data: submitImageData, isFetching: isFetchingImage } = useSubmitImage(image);
  const [searchText, setSearchText] = useState('');
  const [isTextDirty, setIsTextDirty] = useState(false);
  const { clear, hasItem, items, remove, size, update, isFull } = cart;
  const { open, close, configure } = useDialog();

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const [searchType, setSearchType] = useState(SearchType.Text);

  const source = currentSource === SearchSource.Avatar ? 'avatar' : 'creator';
  const [searchSubmission, setSearchSubmission] = useState<SearchSubmission>({
    searchText: '',
    searchType,
    imageId: '',
  });

  const unifiedLogger = useMemo(
    () =>
      new UnifiedLogger({
        product: 'CreatorDashboard',
        eventBaseUrl: eventStreamBaseUrl,
      }),
    [],
  );
  const { account, features } = useCurrentAccountContext();

  const { intervention } = useGetRightsFeatureTimeoutIntervention(
    RMCreateClaimFeatureName,
    account?.id,
  );
  const isBlockedByFeatureTimeout = !!account && !!intervention;

  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    error,
    isFetching,
    isSuccess,
    reset: resetSearch,
  } = useSearchQuery(
    searchSubmission.searchType,
    searchSubmission.searchText,
    searchSubmission.imageId,
    source,
    filter,
  );
  const results = useMemo<Match[]>(() => {
    const discoveredFrom =
      searchType === SearchType.Text
        ? ClaimItemDiscoveredFromEnum.OnDemandTextSearch
        : ClaimItemDiscoveredFromEnum.OnDemandImageSearch;
    return (
      data?.pages
        ?.flatMap((searchResponse) => searchResponse.matches || [])
        .map((searchContent) => {
          return {
            searchContent,
            discoveredFrom,
            source: currentSource,
          };
        }) || []
    );
  }, [data, searchType, currentSource]);

  const [searchHistory, setSearchHistory] = useInitalLocalStorage<string[]>(
    LOCAL_STORAGE_SEARCH_TEXTS_KEY,
    [],
    LOCAL_STORAGE_SEARCH_TEXTS_VERSION,
    deserializeSearchHistory,
    undefined,
  );
  const handleSearchTextChange = useCallback((text: string) => {
    if (text) {
      setSearchType(SearchType.Text);
    }
    setSearchText(text);
  }, []);

  const handleImageSelect = useCallback(
    (img: File | undefined) => {
      if (img) {
        setSearchType(SearchType.Image);
      }
      setImage(img);
      setSearchText('');
    },
    [setImage, setSearchText, setSearchType],
  );

  const handleImageDeselect = useCallback(() => {
    setImage(undefined);
    setSearchType(SearchType.Text);
  }, [setImage]);

  useEffect(() => {
    setFilter('');
  }, [currentSource, searchType]);

  const handleSubmitInput = useCallback(() => {
    const imageId = submitImageData?.imageId || '';

    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.RightsManagerSearchClick,
      parameters: {
        searchType,
        searchText,
        source,
        imageId,
      },
    });

    setSearchSubmission({
      searchText,
      searchType,
      imageId,
    });

    if (!isTextDirty) {
      setIsTextDirty(true);
    }

    setSearchHistory((prev) => {
      if (!searchText) {
        return prev;
      }
      const newHistory = prev.filter((text) => text !== searchText);
      newHistory.unshift(searchText);
      return newHistory.slice(0, SEARCH_HISTORY_LENGTH);
    });
  }, [
    isTextDirty,
    setIsTextDirty,
    searchType,
    searchText,
    submitImageData?.imageId,
    setSearchHistory,
    setSearchSubmission,
    source,
    unifiedLogger,
  ]);

  // create a new function to wrap fetchNextPage
  const fetchNextPageWrapper = useCallback(
    (options?: FetchNextPageOptions) => {
      const visibleResultsCount =
        data?.pages?.map((page) => page.matches?.length).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ??
        0;
      unifiedLogger.logImpressionEvent({
        eventName: CreatorDashboardEventType.RightsManagerSearchResultsLoad,
        parameters: {
          visibleResultsCount: visibleResultsCount.toString(),
        },
      });

      fetchNextPage(options);
    },
    [unifiedLogger, fetchNextPage, data],
  );

  const submitSelections = useCallback(() => {
    onSubmit(items);
  }, [onSubmit, items]);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (
      hasNextPage &&
      isSuccess &&
      data.pages.length !== 0 &&
      data.pages[data.pages.length - 1]?.matches?.length === 0
    ) {
      // Handles case where new page contains no items, resulting in no fetches by the infinite scroll.
      fetchNextPageWrapper({ cancelRefetch: false });
    }
  }, [data, fetchNextPageWrapper, hasNextPage, isSuccess]);

  useEffect(() => {
    if (hasNextPage) {
      return;
    }
    const visibleResultsCount =
      data?.pages?.map((page) => page.matches?.length).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ??
      0;
    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.RightsManagerSearchResultsEnd,
      parameters: {
        visibleResultsCount: visibleResultsCount.toString(),
      },
    });
  }, [unifiedLogger, data, hasNextPage]);

  useEffect(() => {
    if (!error) {
      return;
    }
    if (error.appErrorCode === ErrorResponseAppErrorCodeEnum.InvalidOrExpiredPageToken) {
      configure(
        <SearchExpiredDialog
          onRestartSearch={() => {
            resetSearch();
            close();
          }}
          onContinue={() => close()}
        />,
      );
      open();
    }
  }, [error, open, close, configure, resetSearch]);
  let mainContent = null;
  if (!isTextDirty) {
    mainContent = <BeginSearchState source={source} />;
  } else if (results.length === 0 && isFetching) {
    mainContent = (
      <div style={{ display: 'flex ', justifyContent: 'center' }}>
        <CircularProgress color='secondary' />
      </div>
    );
  } else {
    mainContent = (
      <SearchResultsScrollView
        isCartFull={isFull}
        results={results}
        cartHas={hasItem}
        updateCart={update}
        fetchNextPage={fetchNextPageWrapper}
        hasNextPage={hasNextPage}
      />
    );
  }
  const filterGroups = useMemo(
    () =>
      ENUM_GROUPS.filter((group) => {
        return (
          group.SearchSources.includes(currentSource) && group.SearchTypes.includes(searchType)
        );
      }),
    [currentSource, searchType],
  );

  if (!account || !ready) {
    return <PageLoading />;
  }

  const filterChip = !!filter && (
    <Grid item>
      <Chip
        color='secondary'
        label={translate(getCategoryTLKey(filter))}
        onDelete={() => {
          setFilter('');
        }}
      />
    </Grid>
  );

  const buttonText = features?.enableClaimsAndDisputes
    ? translate('Action.MatchClaimItems')
    : translate('Action.MatchRemoveItems');

  return (
    <Fragment>
      <Grid container direction='column' spacing={3}>
        {isBlockedByFeatureTimeout && (
          <Grid item>
            <ClaimCreationRestrictionBanner intervention={intervention} />
          </Grid>
        )}

        <Grid item sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <SearchInput
            disabled={isBlockedByFeatureTimeout}
            searchType={searchType}
            searchText={searchText}
            searchHistory={searchHistory}
            onSearchTextChange={handleSearchTextChange}
            onSearchHistoryChange={setSearchHistory}
            onSubmit={handleSubmitInput}
            onImageSelect={handleImageSelect}
            onImageDeselect={handleImageDeselect}
            image={submitImageData?.imageBlob}
            isLoading={isFetchingImage}
          />
          <Grid item>{filterChip}</Grid>
          <Grid item sx={{ marginLeft: 'auto', width: '150px' }}>
            <SearchFilterButton
              isMobile={isMobile}
              buttonLabel={translate('Label.FilterBy') as FormattedText}
              drawerTitle={translate('Headings.FilterByCategory') as FormattedText}
              filterDrawerContent={
                <SearchFilterGroups<string>
                  key={filter}
                  enumGroups={filterGroups}
                  value={filter}
                  setValue={(newValue) => {
                    setFilter(newValue[0]);
                  }}
                  formatOption={(o) => {
                    return translate(getCategoryTLKey(o)) as FormattedText;
                  }}
                />
              }
              getDrawerContainer={() => document.body}
              canFilter={filterGroups.length > 0}
            />
          </Grid>
        </Grid>
        <Grid item>{mainContent}</Grid>
      </Grid>
      <SearchFooter isVisible={size > 0}>
        <Grid
          container
          justifyContent='flex-end'
          direction={{
            xs: 'column-reverse',
            sm: 'row',
          }}
          alignItems='stretch'
          spacing={2}>
          <Grid item XSmall='auto'>
            <Button
              sx={{
                width: {
                  xs: '100%',
                  sm: 'auto',
                },
              }}
              variant='outlined'
              color='secondary'
              size='medium'
              onClick={() => setIsCartDrawerOpen(!isCartDrawerOpen)}>
              {`${translate('Label.ViewSelectedItems')} (${size})`}
            </Button>
          </Grid>
          <Grid item XSmall='auto'>
            <Button
              variant='contained'
              size='medium'
              onClick={submitSelections}
              disabled={isBlockedByFeatureTimeout}
              sx={{
                width: {
                  xs: '100%',
                  sm: 'auto',
                },
              }}>
              {buttonText}
            </Button>
          </Grid>
        </Grid>
      </SearchFooter>
      <CartDrawer
        open={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onSubmit={submitSelections}
        cartItems={items}
        clear={clear}
        removeFromCart={remove}
        buttonText={buttonText}
      />
    </Fragment>
  );
};

export default withTranslation(SearchContainer, [
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
]);
