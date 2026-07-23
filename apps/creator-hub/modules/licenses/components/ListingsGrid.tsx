import type { FunctionComponent, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Pagination, Select, MenuItem, ListItemText, CircularProgress } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import {
  LicenseManagerClickEvent,
  useLicenseManagerLogger,
} from '@modules/ip/license-manager/utils/logger';
import TranslatedFailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { Sorts, useListIPListings } from '../hooks/useListIPListings';
import ExploreLicensesEmptyState from './ExploreLicensesEmptyState';
import ListingItem from './ListingItem';
import useListingsGridStyles from './ListingsGrid.styles';

export type ListingsGridProps = {
  browseViewToolbarEndSlot?: ReactNode;
};

const ListingsGrid: FunctionComponent<ListingsGridProps> = ({ browseViewToolbarEndSlot }) => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { user, isFetched: isAuthenticationFetched } = useAuthentication();
  const [activeSort, setActiveSort] = useState(Sorts.MostRecentlyCreated);
  const {
    classes: {
      itemGrid,
      sortToolbarEnd,
      sortToolbarLeadingFlex,
      sortToolbarRow,
      sortToolbarSortWrap,
    },
  } = useListingsGridStyles();

  const [pageTokens, setPageTokens] = useState<string[]>(['']);
  const pageNum = pageTokens.length - 1;
  const selectedSort = useMemo(
    () =>
      isAuthenticationFetched && user === null && activeSort === Sorts.IphResponseTimeLowToHigh
        ? Sorts.MostRecentlyCreated
        : activeSort,
    [isAuthenticationFetched, user, activeSort],
  );

  const { isPending, isError, data } = useListIPListings({
    limit: 30,
    pageToken: pageTokens[pageNum],
    filter: '',
    selectedSort,
  });

  const handleClickDropdownSort = useCallback(
    (nextSort: Sorts) => {
      logEvent(LicenseManagerClickEvent.ExploreLicensesSortDropdownClickEvent, {
        selectedSort: nextSort,
      });
      setActiveSort(nextSort);
      setPageTokens(['']);
    },
    [logEvent],
  );

  const onClickSortMostRecentlyCreated = useCallback(() => {
    handleClickDropdownSort(Sorts.MostRecentlyCreated);
  }, [handleClickDropdownSort]);

  const onClickSortAlphabeticalLowToHigh = useCallback(() => {
    handleClickDropdownSort(Sorts.AlphabeticalLowToHigh);
  }, [handleClickDropdownSort]);

  const onClickSortAlphabeticalHighToLow = useCallback(() => {
    handleClickDropdownSort(Sorts.AlphabeticalHighToLow);
  }, [handleClickDropdownSort]);

  const onClickSortIphResponseTimeLowToHigh = useCallback(() => {
    handleClickDropdownSort(Sorts.IphResponseTimeLowToHigh);
  }, [handleClickDropdownSort]);

  const sortToolbar = (
    <Grid item>
      <div className={sortToolbarRow}>
        <div className={sortToolbarSortWrap} data-testid='explore-licenses-sort-select'>
          <Select size='small' margin='dense' value={selectedSort}>
            <MenuItem
              selected={selectedSort === Sorts.MostRecentlyCreated}
              value={Sorts.MostRecentlyCreated}
              onClick={onClickSortMostRecentlyCreated}>
              <ListItemText primary={translate('Label.MostRecentlyCreated')} />
            </MenuItem>
            <MenuItem
              selected={selectedSort === Sorts.AlphabeticalLowToHigh}
              value={Sorts.AlphabeticalLowToHigh}
              onClick={onClickSortAlphabeticalLowToHigh}>
              <ListItemText primary={translate('Label.AlphabeticalLowToHigh')} />
            </MenuItem>
            <MenuItem
              selected={selectedSort === Sorts.AlphabeticalHighToLow}
              value={Sorts.AlphabeticalHighToLow}
              onClick={onClickSortAlphabeticalHighToLow}>
              <ListItemText primary={translate('Label.AlphabeticalHighToLow')} />
            </MenuItem>
            {user != null && (
              <MenuItem
                selected={selectedSort === Sorts.IphResponseTimeLowToHigh}
                value={Sorts.IphResponseTimeLowToHigh}
                onClick={onClickSortIphResponseTimeLowToHigh}>
                <ListItemText primary={translate('Label.IphResponseTimeLowToHigh')} />
              </MenuItem>
            )}
          </Select>
        </div>
        {browseViewToolbarEndSlot != null ? (
          <div className={sortToolbarEnd}>{browseViewToolbarEndSlot}</div>
        ) : null}
      </div>
    </Grid>
  );

  if (isPending) {
    return (
      <Grid container flexDirection='column' data-testid='explore-licenses-listings-grid'>
        {sortToolbar}
        <Grid item>
          <CircularProgress />
        </Grid>
      </Grid>
    );
  }

  if (isError) {
    return (
      <Grid container flexDirection='column' data-testid='explore-licenses-listings-grid'>
        {sortToolbar}
        <Grid item>
          <TranslatedFailureView
            title={translate('Heading.FailedToLoadPage')}
            message={translate('Message.FailedToLoadPage')}
          />
        </Grid>
      </Grid>
    );
  }

  if (!data || data.listings?.length === 0) {
    return (
      <Grid container flexDirection='column' data-testid='explore-licenses-listings-grid'>
        {browseViewToolbarEndSlot != null && (
          <Grid item>
            <div className={sortToolbarRow}>
              <div className={sortToolbarLeadingFlex} aria-hidden />
              <div className={sortToolbarEnd}>{browseViewToolbarEndSlot}</div>
            </div>
          </Grid>
        )}
        <Grid item>
          <ExploreLicensesEmptyState />
        </Grid>
      </Grid>
    );
  }

  const handleNextPage = () => {
    const nextPageNum = pageNum + 1;
    if (nextPageNum >= pageTokens.length) {
      setPageTokens([...pageTokens, data.nextPageToken ?? '']);
    }
  };

  const handlePreviousPage = () => {
    if (pageNum > 0) {
      setPageTokens(pageTokens.slice(0, -1));
    }
  };

  return (
    <Grid container flexDirection='column' data-testid='explore-licenses-listings-grid'>
      {sortToolbar}
      <Grid item container className={itemGrid}>
        {data.listings?.map((listing, index) => (
          <ListingItem
            key={listing.id}
            listing={listing}
            tilePosition={index + 1}
            pageNumber={pageNum + 1}
            filterTab='all'
          />
        ))}
      </Grid>
      <Grid
        item
        container
        justifyContent='center'
        alignItems='center'
        data-testid='explore-licenses-pagination'>
        <Pagination
          page={pageNum + 1}
          nextProps={{
            disabled: !data.nextPageToken,
            onClick: handleNextPage,
          }}
          previousProps={{
            disabled: pageNum === 0,
            onClick: handlePreviousPage,
          }}
          shape='circular'
          size='medium'
          variant='reduced'
        />
      </Grid>
    </Grid>
  );
};

export default ListingsGrid;
