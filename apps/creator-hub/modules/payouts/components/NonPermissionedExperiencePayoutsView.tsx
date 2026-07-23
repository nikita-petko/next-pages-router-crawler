import React, { Fragment, FunctionComponent, useEffect, useState, useCallback } from 'react';
import { CircularProgress, Grid, makeStyles, Pagination } from '@rbx/ui';
import { Organization } from '@modules/clients/organizationApi';
import { UniverseModel } from '@rbx/clients/universesApi';
import { gamesClient, organizationApiClient } from '@modules/clients';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import ExperiencePayoutsAccordion from './ExperiencePayoutsAccordion';

const useExperiencePayoutsViewStyles = makeStyles()(() => ({
  accordionContainer: {
    '& > *:not(:first-child)': {
      marginTop: 8,
    },
  },
  paginationContainer: {
    width: '100%',
    marginTop: 16,
  },
}));

const PAGE_SIZE = 10;
export type NonPermissionedExperiencePayoutsViewProps = {
  organization: Organization;
  disabled?: boolean;
};

const NonPermissionedExperiencePayoutsView: FunctionComponent<
  NonPermissionedExperiencePayoutsViewProps
> = ({ organization, disabled = false }) => {
  const {
    classes: { accordionContainer, paginationContainer },
  } = useExperiencePayoutsViewStyles();

  const [universesLoading, setUniversesLoading] = useState(true);

  const [displayedUniverses, setDisplayedUniverses] = useState<UniverseModel[]>([]);

  const [page, setPage] = useState<number>(-1);
  const [lastPage, setLastPage] = useState<number | undefined>(undefined);
  const [nextCursor, setNextCursor] = useState<string>('');

  const [savedUniverseDetails, setSavedUniverseDetails] = useState<UniverseModel[] | undefined>(
    undefined,
  );

  // Due to EAAS pagination wackiness, we save the pagination results locally in states
  const fetchData = useCallback(
    async (cursor: string, currentPage: number) => {
      // Increment page on fetch since this means we are on a new page
      setPage((pg) => pg + 1);

      const findResult = await organizationApiClient.groupUniversePayoutClient.findUniversePayouts({
        organizationId: organization.id,
        limit: PAGE_SIZE,
        cursor,
      });
      if (findResult && findResult.data && findResult.data.records) {
        const newIds = findResult.data!.records.map((payout) => Number(payout.universeId));

        // If user not in any splits, do not attempt further loading and show
        // unable to view message
        if (newIds.length === 0) {
          setSavedUniverseDetails([]);
          setUniversesLoading(false);
          return;
        }

        const universeDetailsResponse = await gamesClient.getDetails(newIds);
        const universeDetails = universeDetailsResponse.data ?? [];

        setSavedUniverseDetails((details) => {
          if (details !== undefined) {
            return [...details, ...universeDetails];
          }
          return universeDetails;
        });

        setNextCursor(findResult.data.nextCursor ?? '');
        if (!findResult.data.hasMore) {
          setLastPage(currentPage + 1);
        }

        setDisplayedUniverses(universeDetails);
        setUniversesLoading(false);
      }
    },
    [organization.id],
  );

  useEffect(() => {
    // First load, page starts at -1 as we are 0-indexed and fetching auto
    // increments page number
    fetchData('', -1);
  }, [fetchData]);

  const handlePrevious = useCallback(() => {
    if (savedUniverseDetails === undefined) {
      return;
    }

    // set page must come after displayed universes update
    setDisplayedUniverses(savedUniverseDetails.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    setPage((pg) => pg - 1);
  }, [page, savedUniverseDetails]);

  const handleNext = useCallback(() => {
    if (savedUniverseDetails === undefined) {
      return;
    }

    // have not loaded the next page yet
    if ((page + 1) * PAGE_SIZE >= savedUniverseDetails.length) {
      setUniversesLoading(true);
      fetchData(nextCursor, page);
    } else {
      // set page must come after displayed universes update
      setDisplayedUniverses(
        savedUniverseDetails.slice((page + 1) * PAGE_SIZE, (page + 2) * PAGE_SIZE),
      );
      setPage((pg) => pg + 1);
    }
  }, [fetchData, nextCursor, page, savedUniverseDetails]);

  return (
    <Grid container className={accordionContainer}>
      {displayedUniverses.length !== 0 ? (
        <Fragment>
          {universesLoading ? (
            <Grid container justifyContent='center'>
              <CircularProgress color='secondary' />
            </Grid>
          ) : (
            displayedUniverses
              ?.filter((e) => !!e.id)
              .map((experience) => (
                <ExperiencePayoutsAccordion
                  key={experience.id}
                  organization={organization}
                  universe={experience}
                  disabled={disabled}
                />
              ))
          )}

          <Grid container className={paginationContainer} justifyContent='center'>
            <Pagination
              nextProps={{
                disabled: page === lastPage || universesLoading,
                onClick: handleNext,
              }}
              page={page + 1}
              previousProps={{
                disabled: page === 0,
                onClick: handlePrevious,
              }}
              shape='rounded'
              size='medium'
              variant='reduced'
            />
          </Grid>
        </Fragment>
      ) : (
        <Grid container justifyContent='center'>
          {(universesLoading || savedUniverseDetails === undefined) && (
            <CircularProgress color='secondary' />
          )}
          {savedUniverseDetails?.length === 0 && <ErrorPage errorCode={StatusCodes.FORBIDDEN} />}
        </Grid>
      )}
    </Grid>
  );
};

export default NonPermissionedExperiencePayoutsView;
