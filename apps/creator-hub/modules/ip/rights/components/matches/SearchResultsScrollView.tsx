import { useCallback, useEffect, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { SearchContent } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography } from '@rbx/ui';
import { UnifiedLogger } from '@rbx/unified-logger';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ContentTile from './ContentTile';
import type Match from './Match';

export function searchContentEquals(a: SearchContent, b: SearchContent) {
  return a.contentId === b.contentId && a.contentType === b.contentType;
}

// If we hit an error, wait 30 seconds and try again.
// This number is somewhat arbitrary, but from testing it's a decent guess
// for how long it might take for the endpoint to start succeeding again
// (mainly for rate limit errors).
const FETCH_RETRY_DELAY_MS = 30_000;

export interface ScrollViewProps {
  results: Match[];
  fetchNextPage: () => unknown;
  hasNextPage: boolean;
  fetchNextPageErrored?: boolean;
  isFetchingNextPage?: boolean;
  isCartFull: boolean;
  cartHas: (item: Match) => boolean;
  updateCart: (elem: Match) => void;
}

const SearchResultsScrollView = ({
  results,
  fetchNextPage,
  hasNextPage,
  fetchNextPageErrored = false,
  isFetchingNextPage = false,
  updateCart,
  cartHas,
  isCartFull,
}: ScrollViewProps) => {
  const { translate, ready } = useTranslation();

  const isWaitingToRetry = fetchNextPageErrored && hasNextPage && !isFetchingNextPage;

  useEffect(() => {
    if (!isWaitingToRetry) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      fetchNextPage();
    }, FETCH_RETRY_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [fetchNextPage, isWaitingToRetry]);

  const handleFetchNextPage = useCallback(() => {
    if (isFetchingNextPage || isWaitingToRetry) {
      return;
    }
    fetchNextPage();
  }, [fetchNextPage, isFetchingNextPage, isWaitingToRetry]);

  const unifiedLogger = useMemo(
    () =>
      new UnifiedLogger({
        product: 'CreatorDashboard',
        eventBaseUrl: eventStreamBaseUrl,
      }),
    [],
  );

  useEffect(() => {
    // It's possible the initial fetch does not contain enough items to enable scrolling.
    // This triggers a scroll event, which, if there is no scrollbar, will trigger another query.
    document?.getElementById(SCROLL_CONTAINER_ID)?.dispatchEvent(new Event('scroll'));
  }, [results.length]);

  const setSelected = useCallback(
    (match: Match) => {
      updateCart(match);
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.RightsManagerSearchResultClick,
        parameters: {
          contentId: match.searchContent.contentId ?? '',
          contentType: match.searchContent.contentType ?? '',
        },
      });
    },
    [updateCart, unifiedLogger],
  );

  if (!ready) {
    return null;
  }
  if (results.length === 0) {
    return (
      <EmptyStateBorder>
        <EmptyState
          title={translate('Heading.NoResults')}
          description={translate('Description.NoResults')}
          size='small'
          illustration='oof'
        />
      </EmptyStateBorder>
    );
  }

  const loadingFooter = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        padding: '14px',
      }}>
      <CircularProgress color='secondary' size={24} />
    </div>
  );

  return (
    <InfiniteScroll
      dataLength={results.length}
      next={handleFetchNextPage}
      hasMore={hasNextPage}
      loader={isFetchingNextPage ? loadingFooter : undefined}
      scrollableTarget={SCROLL_CONTAINER_ID}
      endMessage={
        !fetchNextPageErrored ? (
          <div style={{ textAlign: 'center', padding: '14px' }}>
            <Typography variant='subtitle1'>
              <b>{translate('Description.NoMoreSearchResults')}</b>
            </Typography>
          </div>
        ) : undefined
      }>
      <Grid container spacing={1} overflow='hidden'>
        {results.map((item) => {
          const isItemSelected = cartHas(item);
          return (
            <Grid item key={`${item.searchContent.contentId}${item.searchContent.contentType}`}>
              <ContentTile
                disabled={isCartFull && !isItemSelected}
                match={item}
                selected={isItemSelected}
                setSelected={setSelected}
              />
            </Grid>
          );
        })}
      </Grid>
      {isWaitingToRetry ? loadingFooter : null}
    </InfiniteScroll>
  );
};

export default withTranslation(SearchResultsScrollView, [
  TranslationNamespace.Controls,
  TranslationNamespace.RightsPortal,
]);
