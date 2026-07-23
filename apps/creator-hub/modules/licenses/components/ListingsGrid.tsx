import { FunctionComponent, useState, useEffect } from 'react';
import { Grid, Pagination, Select, MenuItem, ListItemText, CircularProgress } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useAuthentication } from '@modules/authentication/providers';
import {
  LicenseManagerClickEvent,
  useLicenseManagerLogger,
} from '@modules/ip/license-manager/utils/logger';

import ListingItem from './ListingItem';
import useListingsGridStyles from './ListingsGrid.styles';
import ExploreLicensesEmptyState from './ExploreLicensesEmptyState';
import { Sorts, useListIPListings } from '../hooks/useListIPListings';

const ListingsGrid: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { user, isFetched: isAuthenticationFetched } = useAuthentication();
  const [activeSort, setActiveSort] = useState(Sorts.MostRecentlyCreated);
  const {
    classes: { itemGrid },
  } = useListingsGridStyles();

  const [pageTokens, setPageTokens] = useState<string[]>(['']);
  const pageNum = pageTokens.length - 1;

  const { isPending, isError, data } = useListIPListings({
    limit: 30,
    pageToken: pageTokens[pageNum],
    filter: '',
    selectedSort: activeSort,
  });

  useEffect(() => {
    if (isAuthenticationFetched && user === null && activeSort === Sorts.IphResponseTimeLowToHigh) {
      setActiveSort(Sorts.MostRecentlyCreated);
    }
  }, [isAuthenticationFetched, user, activeSort]);

  // Reset pagination to first page when sort changes
  useEffect(() => {
    setPageTokens(['']);
  }, [activeSort]);

  const handleClickDropdownSort = (selectedSort: Sorts) => {
    logEvent(LicenseManagerClickEvent.ExploreLicensesSortDropdownClickEvent, {
      selectedSort,
    });
    setActiveSort(selectedSort);
  };

  if (isPending) {
    return <CircularProgress />;
  }

  if (isError) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
      />
    );
  }

  if (!data || data.listings?.length === 0) {
    return <ExploreLicensesEmptyState />;
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
      <Grid item data-testid='explore-licenses-sort-select'>
        <Select size='small' margin='dense' value={activeSort}>
          <MenuItem
            selected={activeSort === Sorts.MostRecentlyCreated}
            value={Sorts.MostRecentlyCreated}
            onClick={() => handleClickDropdownSort(Sorts.MostRecentlyCreated)}>
            <ListItemText primary={translate('Label.MostRecentlyCreated')} />
          </MenuItem>
          <MenuItem
            selected={activeSort === Sorts.AlphabeticalLowToHigh}
            value={Sorts.AlphabeticalLowToHigh}
            onClick={() => handleClickDropdownSort(Sorts.AlphabeticalLowToHigh)}>
            <ListItemText primary={translate('Label.AlphabeticalLowToHigh')} />
          </MenuItem>
          <MenuItem
            selected={activeSort === Sorts.AlphabeticalHighToLow}
            value={Sorts.AlphabeticalHighToLow}
            onClick={() => handleClickDropdownSort(Sorts.AlphabeticalHighToLow)}>
            <ListItemText primary={translate('Label.AlphabeticalHighToLow')} />
          </MenuItem>
          {user != null && (
            <MenuItem
              selected={activeSort === Sorts.IphResponseTimeLowToHigh}
              value={Sorts.IphResponseTimeLowToHigh}
              onClick={() => handleClickDropdownSort(Sorts.IphResponseTimeLowToHigh)}>
              <ListItemText primary={translate('Label.IphResponseTimeLowToHigh')} />
            </MenuItem>
          )}
        </Select>
      </Grid>
      <Grid item container className={itemGrid}>
        {data.listings?.map((listing) => (
          <ListingItem key={listing.id} listing={listing} />
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
