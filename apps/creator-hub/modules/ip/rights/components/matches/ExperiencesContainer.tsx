import { PageLoading } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, CircularProgress, Grid, makeStyles } from '@rbx/ui';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { Account } from '@rbx/clients/rightsV1';
import { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/clients/games';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import CartDrawer from './CartDrawer';
import SearchFooter from './SearchFooter';
import ExperiencesTable from './ExperiencesTable';
import useCart from './useCart';
import Match from './Match';
import useCursorPagination, { usePaginationProps } from '../../hooks/useCursorPagination';
import useListMatches from '../../hooks/useListMatches';
import useMultigetPlaceDetails from '../../hooks/useMultigetPlaceDetails';

const useStyles = makeStyles()(() => ({
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
}));

interface ExperiencesContainerProps {
  onSubmit: (content: Match[]) => void;
  account: Account;
  cart: ReturnType<typeof useCart>;
  setOriginalContent: (originalContent: RobloxGamesApiModelsResponsePlaceDetails | null) => void;
  isClaimsAndDisputesEnabled?: boolean;
}

// ExperiencesContainer is shown to a small cohort of top creators, displaying
// the matched experiences (potentially infringing) for their top experience
const ExperiencesContainer = ({
  onSubmit,
  account,
  cart,
  setOriginalContent,
  isClaimsAndDisputesEnabled,
}: ExperiencesContainerProps) => {
  const { classes } = useStyles();

  const { ready, translate } = useTranslation();

  const { clear, items, remove, size } = cart;
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const submitSelections = useCallback(() => {
    onSubmit(items);
  }, [onSubmit, items]);

  const { onPageChange, pageToken, pagination, rowsPerPage } = useCursorPagination();

  const { matches, nextPageToken, isLoading } = useListMatches(
    account.id ?? '',
    rowsPerPage[0],
    pageToken || '',
  );
  const isEmpty = matches?.length === 0;

  // all matches have the same ownerContentId
  const originalPlaceId = matches?.[0]?.ownerContentId ?? '';

  // the content id on the match is the root place Id of the experience. we want to get the universe id.
  const placeIds = matches?.map((match) => match.infringingContentId ?? '') ?? [];
  placeIds.push(originalPlaceId);
  const { placeToGameDetailsMap, isLoading: isPlaceDetailsLoading } =
    useMultigetPlaceDetails(placeIds);

  // Set original content to avoid infinite rerenders
  useEffect(() => {
    if (originalPlaceId !== '') {
      const details = placeToGameDetailsMap.get(originalPlaceId);
      setOriginalContent(details ?? null);
    }
  }, [originalPlaceId, setOriginalContent, placeToGameDetailsMap]);

  const { paginationProps } = usePaginationProps(
    nextPageToken,
    pagination.pageIndex,
    onPageChange,
    isLoading,
  );

  if (isLoading || isPlaceDetailsLoading) {
    return (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyStateBorder>
        <EmptyState
          title={translate('Heading.NoMatchesFound')}
          size='small'
          description={translate('Description.NoMatchesFound')}
        />
      </EmptyStateBorder>
    );
  }

  if (!ready) {
    return <PageLoading />;
  }

  const buttonText = isClaimsAndDisputesEnabled
    ? translate('Action.MatchClaimExperiences')
    : translate('Action.MatchRemoveExperiences');

  return (
    <Fragment>
      <Grid container direction='column' spacing={3}>
        <Grid item>
          <ExperiencesTable
            cart={cart}
            matches={matches}
            placeToGameDetailsMap={placeToGameDetailsMap}
            paginationProps={paginationProps}
          />
        </Grid>
      </Grid>
      <SearchFooter isVisible={items.length > 0}>
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
              {`${translate('Label.ViewSelectedExperiences')} (${size})`}
            </Button>
          </Grid>
          <Grid item XSmall='auto'>
            <Button
              variant='contained'
              size='medium'
              onClick={submitSelections}
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

export default withTranslation(ExperiencesContainer, [
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.Creations,
  TranslationNamespace.DeveloperItem,
  TranslationNamespace.Error,
  TranslationNamespace.RightsPortal,
]);
