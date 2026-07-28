import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircularProgress } from '@mui/material';
import type { FetchNextPageOptions } from '@tanstack/react-query';
import { ClaimItemDiscoveredFromEnum } from '@rbx/client-rights/v1';
import type { IPContent } from '@rbx/client-rights/v1';
import { Button as FUIButton } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Button as UIButton,
  Grid,
  makeStyles,
  IconButton,
  CloseIcon,
  Chip,
  useTheme,
  useMediaQuery,
} from '@rbx/ui';
import { UnifiedLogger } from '@rbx/unified-logger';
import type { FormattedText } from '@modules/analytics-translations/types';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import { EmptyState, EmptyStateBorder, PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { useListAllIpContentsByAccount } from '../../../ipFamilies/hooks/ipFamily';
import {
  RMCreateClaimFeatureName,
  useGetRightsFeatureTimeoutIntervention,
} from '../../hooks/useInterventions';
import ClaimCreationRestrictionBanner from '../error/ClaimCreationRestrictionBanner';
import CartDrawer from './CartDrawer';
import ImageIPContentSelectorDialog from './ImageIPContentSelectorDialog';
import KeywordSelector from './KeywordSelector';
import type Match from './Match';
import { ENUM_GROUPS, getCategoryTLKey, SearchSource, SearchType } from './SearchEnums';
import SearchFilterButton from './SearchFilterButton';
import SearchFilterGroups from './SearchFilterGroups';
import SearchFooter from './SearchFooter';
import SearchResultsScrollView from './SearchResultsScrollView';
import type { useCart } from './useCart';
import useSearchQuery from './useSearchQuery';

interface IPContentSearchContainerProps {
  onSubmit: (content: Match[]) => void;
  cart: ReturnType<typeof useCart>;
  currentSource: SearchSource;
}

const useStyles = makeStyles()(() => ({
  selectedImagePreview: {
    display: 'block',
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    paddingTop: '0px',
  },
}));

const IPContentSearchContainer = ({
  onSubmit,
  cart,
  currentSource,
}: IPContentSearchContainerProps) => {
  const { ready: translationReady, translate, translateHTML } = useTranslation();
  const { account, features } = useCurrentAccountContext();
  const { classes } = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('Medium'));

  const {
    clear: clearCart,
    hasItem: cartHasItem,
    items: cartItems,
    remove: removeFromCart,
    size: cartSize,
    update: updateCart,
    isFull: isCartFull,
  } = cart;
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const cartButtonText = features?.enableClaimsAndDisputes
    ? translate('Action.MatchClaimItems')
    : translate('Action.MatchRemoveItems');

  const unifiedLogger = useMemo(
    () =>
      new UnifiedLogger({
        product: 'CreatorDashboard',
        eventBaseUrl: eventStreamBaseUrl,
      }),
    [],
  );

  const { intervention } = useGetRightsFeatureTimeoutIntervention(
    RMCreateClaimFeatureName,
    account?.id,
  );
  const isBlockedByFeatureTimeout = !!account && !!intervention;

  // Get all keywords (text only, no images)
  const { data: keywordData, isError: errorFetchingKeywords } = useListAllIpContentsByAccount({
    filter: { key: 'ip_content_type', value: 'Text' },
  });

  // Sort keywords into primary/secondary
  // Secondary keywords are grouped by IP family
  const [primaryKeywords, secondaryKeywords] = useMemo(() => {
    const primary: IPContent[] = [];
    const secondary: Record<string, IPContent[]> = {};
    keywordData?.ipContents.forEach((content) => {
      if (content.isPrimary) {
        primary.push(content);
      } else {
        if (secondary[content.ipFamilyId ?? ''] === undefined) {
          secondary[content.ipFamilyId ?? ''] = [];
        }
        secondary[content.ipFamilyId ?? ''].push(content);
      }
    });
    return [primary, secondary];
  }, [keywordData]);

  // The currently selected keywords in the combo boxes
  const [currentPrimary, setCurrentPrimary] = useState<IPContent | undefined>(undefined);
  const [currentSecondary, setCurrentSecondary] = useState<IPContent | undefined>(undefined);
  const [currentImage, setCurrentImage] = useState<IPContent | undefined>(undefined);
  const [imageSelectorDialogOpen, setImageSelectorDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');

  // State used for searching
  const source = currentSource === SearchSource.Avatar ? 'avatar' : 'creator';
  const [searchType, setSearchType] = useState(SearchType.Text);

  // Filter groups
  const filterGroups = useMemo(
    () =>
      ENUM_GROUPS.filter((group) => {
        return (
          group.SearchSources.includes(currentSource) && group.SearchTypes.includes(searchType)
        );
      }),
    [currentSource, searchType],
  );

  // When we change the source, clear the filter
  const [prevSource, setPrevSource] = useState<string | null>(null);
  if (prevSource !== currentSource) {
    setPrevSource(currentSource);
    setFilter('');
  }

  // IP content ids
  const ipContentIds = useMemo<string[]>(() => {
    switch (searchType) {
      case SearchType.Text:
        return [currentPrimary?.id, currentSecondary?.id].filter((x) => x !== undefined);
      case SearchType.Image:
        return [currentImage?.id].filter((x) => x !== undefined);
      default: {
        const exhaustiveCheck: never = searchType;
        throw new Error(`Invalid search type: ${exhaustiveCheck as string}`);
      }
    }
  }, [searchType, currentPrimary, currentSecondary, currentImage]);

  const logSearchClick = useCallback(() => {
    if (ipContentIds.length > 0) {
      let searchText = '';
      if (searchType === SearchType.Text) {
        searchText = [currentPrimary?.contentValue, currentSecondary?.contentValue]
          .filter((x) => x !== undefined)
          .join(' ');
      }
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.RightsManagerSearchClick,
        parameters: {
          searchType,
          ipContentIds: ipContentIds?.join(',') ?? '',
          searchText,
          source,
        },
      });
    }
  }, [currentPrimary, currentSecondary, searchType, source, unifiedLogger, ipContentIds]);

  const {
    response: {
      data: fetchedData,
      fetchNextPage,
      hasNextPage,
      isFetching,
      isFetchingNextPage,
      isError,
      isFetchNextPageError,
    },
  } = useSearchQuery(searchType, { ipContentIds }, source, filter);

  const hasTopLevelSearchError = ipContentIds.length > 0 && isError && !isFetchNextPageError;

  const fetchNextPageWrapper = useCallback(
    (options?: FetchNextPageOptions) => {
      const visibleResultsCount =
        fetchedData?.pages
          ?.map((page) => page.matches?.length)
          .reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;
      unifiedLogger.logImpressionEvent({
        eventName: CreatorDashboardEventType.RightsManagerSearchResultsLoad,
        parameters: {
          visibleResultsCount: visibleResultsCount.toString(),
        },
      });

      void fetchNextPage(options);
    },
    [unifiedLogger, fetchNextPage, fetchedData],
  );

  // Memoize the search results
  const searchResults = useMemo<Match[]>(() => {
    const discoveredFrom =
      searchType === SearchType.Text
        ? ClaimItemDiscoveredFromEnum.OnDemandTextSearch
        : ClaimItemDiscoveredFromEnum.OnDemandImageSearch;
    return (
      fetchedData?.pages
        ?.flatMap((searchResponse) => searchResponse.matches ?? [])
        .map((searchContent) => {
          return {
            searchContent,
            discoveredFrom,
            source: currentSource,
          };
        }) ?? []
    );
  }, [fetchedData, searchType, currentSource]);

  const submitSelections = useCallback(() => {
    onSubmit(cartItems);
  }, [onSubmit, cartItems]);

  // Log an impression when we're out of pages
  useEffect(() => {
    const visibleResultsCount = searchResults.length;
    if (visibleResultsCount === 0 || hasNextPage) {
      return;
    }
    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.RightsManagerSearchResultsEnd,
      parameters: {
        visibleResultsCount: visibleResultsCount.toString(),
      },
    });
  }, [unifiedLogger, searchResults, hasNextPage]);

  if (!translationReady || !account) {
    return <PageLoading />;
  }

  const mainContent =
    searchResults.length > 0 ? (
      <SearchResultsScrollView
        isCartFull={isCartFull}
        results={searchResults}
        fetchNextPageErrored={isFetchNextPageError}
        isFetchingNextPage={isFetchingNextPage}
        cartHas={cartHasItem}
        updateCart={updateCart}
        fetchNextPage={fetchNextPageWrapper}
        hasNextPage={hasNextPage}
      />
    ) : isFetching ? (
      <div style={{ display: 'flex ', justifyContent: 'center' }}>
        <CircularProgress color='secondary' />
      </div>
    ) : hasTopLevelSearchError || errorFetchingKeywords ? (
      <EmptyStateBorder>
        <EmptyState
          title={translate('Heading.GenericError')}
          description={translate('Response.TryAgainLater')}
          size='small'
          illustration='oof'
        />
      </EmptyStateBorder>
    ) : (
      <EmptyStateBorder>
        <EmptyState
          title={translate('Heading.NoResults')}
          description={translate('Description.NoResults')}
          size='small'
          illustration='oof'
        />
      </EmptyStateBorder>
    );

  const keywordSelectors = (
    <>
      <KeywordSelector
        keywords={primaryKeywords}
        currentKeyword={currentPrimary}
        onChange={(keyword) => {
          setCurrentPrimary(keyword);
          setCurrentSecondary(undefined);
          setCurrentImage(undefined);
          if (searchType !== SearchType.Text) {
            setSearchType(SearchType.Text);
            setFilter('');
          }
          logSearchClick();
        }}
        placeholder={translate('Label.PrimaryKeyword')}
      />
      <KeywordSelector
        keywords={secondaryKeywords[currentPrimary?.ipFamilyId ?? ''] ?? []}
        currentKeyword={currentSecondary}
        onChange={(keyword) => {
          setCurrentSecondary(keyword);
          setCurrentImage(undefined);
          if (searchType !== SearchType.Text) {
            setSearchType(SearchType.Text);
            setFilter('');
          }
          logSearchClick();
        }}
        placeholder={translate('Label.SecondaryKeyword')}
        disabled={!currentPrimary}
      />
    </>
  );

  const imageSearching = (
    <>
      <FUIButton
        onClick={() => {
          setImageSelectorDialogOpen(true);
        }}
        variant='Standard'
        icon='icon-regular-image'
        size='Medium'>
        {translate('Action.SearchByImage')}
      </FUIButton>
      {currentImage && (
        <>
          <Thumbnail2d
            targetId={parseInt(currentImage.contentValue ?? '', 10)}
            type={ThumbnailTypes.assetThumbnail}
            alt={translate('Label.IpContentThumbnail')}
            containerClass={classes.selectedImagePreview}
          />
          <IconButton
            aria-label={translate('Action.Clear')}
            onClick={() => {
              setCurrentImage(undefined);
            }}
            color='secondary'>
            <CloseIcon />
          </IconButton>
        </>
      )}
    </>
  );

  const keywordSelectorsOrImageSearch = translateHTML('Action.KeywordsOrImageSearch', null, {
    keywordSelectors,
    imageSearching,
  });

  return (
    <>
      <Grid container direction='column' spacing={3}>
        {isBlockedByFeatureTimeout && (
          <Grid item>
            <ClaimCreationRestrictionBanner intervention={intervention} />
          </Grid>
        )}
        <Grid item container direction='row' sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {keywordSelectorsOrImageSearch}
          <Grid item marginLeft='auto'>
            <Grid container direction='row' alignItems='center' gap={1}>
              {filter && (
                <Grid item>
                  <Chip
                    size='large'
                    color='secondary'
                    label={translate(getCategoryTLKey(filter))}
                    onDelete={() => {
                      setFilter('');
                    }}
                  />
                </Grid>
              )}
              <Grid item sx={{ marginLeft: 'auto', width: '150px' }}>
                <SearchFilterButton
                  isMobile={isMobile}
                  // FormattedText is intended to be cast from a string.
                  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
                  buttonLabel={translate('Label.FilterBy') as FormattedText}
                  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
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
                        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
                        return translate(getCategoryTLKey(o)) as FormattedText;
                      }}
                    />
                  }
                  getDrawerContainer={() => document.body}
                  canFilter={filterGroups.length > 0}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>{mainContent}</Grid>
      </Grid>
      <SearchFooter isVisible={cartSize > 0}>
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
            <UIButton
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
              {`${translate('Label.ViewSelectedItems')} (${cartSize})`}
            </UIButton>
          </Grid>
          <Grid item XSmall='auto'>
            <UIButton
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
              {cartButtonText}
            </UIButton>
          </Grid>
        </Grid>
      </SearchFooter>
      <CartDrawer
        open={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onSubmit={submitSelections}
        cartItems={cartItems}
        clear={clearCart}
        removeFromCart={removeFromCart}
        buttonText={cartButtonText}
      />
      <ImageIPContentSelectorDialog
        open={imageSelectorDialogOpen}
        setOpen={setImageSelectorDialogOpen}
        onImageChosen={(image) => {
          setCurrentImage(image);
          setCurrentPrimary(undefined);
          setCurrentSecondary(undefined);
          if (searchType !== SearchType.Image) {
            setSearchType(SearchType.Image);
            setFilter('');
          }
          logSearchClick();
        }}
      />
    </>
  );
};

export default withTranslation(IPContentSearchContainer, [
  TranslationNamespace.AgreementsManager,
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
  TranslationNamespace.Navigation,
]);
