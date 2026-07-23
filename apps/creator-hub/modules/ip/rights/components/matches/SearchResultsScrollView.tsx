import { SCROLL_CONTAINER_ID } from '@modules/navigation/layout/components/AppLayout';
import { SearchContent } from '@rbx/clients/rightsV1';
import { Grid, Typography } from '@rbx/ui';
import React, { useEffect, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { eventStreamBaseUrl } from '@modules/eventStream/tracker';
import ContentTile from './ContentTile';
import SearchEmptyState from './SearchEmptyState';
import Match from './Match';

export function searchContentEquals(a: SearchContent, b: SearchContent) {
  return a.contentId === b.contentId && a.contentType === b.contentType;
}
export interface ScrollViewProps {
  results: Match[];
  fetchNextPage: () => unknown;
  hasNextPage: boolean;

  isCartFull: boolean;
  cartHas: (item: Match) => boolean;
  updateCart: (elem: Match) => void;
}

const SearchResultsScrollView = ({
  results,
  fetchNextPage,
  hasNextPage,
  updateCart,
  cartHas,
  isCartFull,
}: ScrollViewProps) => {
  const { translate, ready } = useTranslation();

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
    document?.getElementById(SCROLL_CONTAINER_ID)?.dispatchEvent(new CustomEvent('scroll'));
  }, [results.length]);

  if (!ready) {
    return null;
  }
  if (results.length === 0) {
    return <SearchEmptyState />;
  }

  const setSelected = (match: Match) => {
    updateCart(match);

    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.RightsManagerSearchResultClick,
      parameters: {
        contentId: match.searchContent.contentId || '',
        contentType: match.searchContent.contentType || '',
      },
    });
  };

  return (
    <InfiniteScroll
      dataLength={results.length}
      next={fetchNextPage}
      hasMore={hasNextPage}
      loader
      scrollableTarget={SCROLL_CONTAINER_ID}
      endMessage={
        <div style={{ textAlign: 'center', padding: '14px' }}>
          <Typography variant='subtitle1'>
            <b>{translate('Description.NoMoreSearchResults')}</b>
          </Typography>
        </div>
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
    </InfiniteScroll>
  );
};

export default withTranslation(SearchResultsScrollView, [TranslationNamespace.RightsPortal]);
