import type { FunctionComponent } from 'react';
import { Fragment } from 'react';
import { Surface } from '@rbx/client-universes-api/v1';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography, makeStyles } from '@rbx/ui';
import GenericTablePagination from '@modules/charts-generic/tables/GenericTablePagination';
import type { Organization } from '@modules/clients/organizationApi';
import useOwner from '@modules/experience-analytics-shared/context/useOwner';
import usePaginatedSearchUniverses from '@modules/experience-analytics-shared/hooks/usePaginatedSearchUniverses';
import useGetActiveAgreementsForAccount from '../hooks/rights';
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

export type ExperiencePayoutsViewProps = {
  organization: Organization;
  disabled?: boolean;
};

const ExperiencePayoutsView: FunctionComponent<ExperiencePayoutsViewProps> = ({
  organization,
  disabled = false,
}) => {
  const {
    classes: { accordionContainer, paginationContainer },
  } = useExperiencePayoutsViewStyles();

  const { translate } = useTranslation();
  const owner = useOwner();

  const {
    data: mostRecentExperiencesData,
    isDataLoading,
    isUserForbidden,
    isResponseFailed,
    pagination,
  } = usePaginatedSearchUniverses({
    owner,
    pageSizeOptions: [10, 20, 50, 100],
    defaultPageSize: 10,
    surface: Surface.CreatorHubGroupPayout,
  });

  // We do not handle errors here as we do not want to prevent the user from
  // seeing payout information if the rights service is down.
  const { data: agreementsMap, isLoading: isAgreementsLoading } =
    useGetActiveAgreementsForAccount();

  return (
    <Grid container className={accordionContainer}>
      {isUserForbidden && (
        <Grid container justifyContent='center'>
          <Typography>{translate('Message.UserHasNoPermission')}</Typography>
        </Grid>
      )}

      {isResponseFailed && (
        <Grid container justifyContent='center'>
          <Typography>{translate('Message.UnableToLoadExperiences')}</Typography>
        </Grid>
      )}

      {!isUserForbidden && !isResponseFailed && (
        <>
          {mostRecentExperiencesData?.data?.length !== 0 ? (
            <Fragment>
              {mostRecentExperiencesData?.data
                ?.filter((e) => !!e.id)
                .map((experience) => (
                  <ExperiencePayoutsAccordion
                    key={experience.id}
                    organization={organization}
                    universe={experience}
                    disabled={disabled}
                    agreement={agreementsMap?.get(experience.id?.toString() ?? '')}
                  />
                ))}

              {mostRecentExperiencesData !== null && (
                <Grid container className={paginationContainer} justifyContent='center'>
                  <GenericTablePagination {...pagination} />
                </Grid>
              )}
            </Fragment>
          ) : (
            <Fragment>
              {!isDataLoading && (
                <Grid container justifyContent='center'>
                  <Typography>{translate('Message.NoExperiences')}</Typography>
                </Grid>
              )}
            </Fragment>
          )}
        </>
      )}

      {(isDataLoading || mostRecentExperiencesData === null || isAgreementsLoading) &&
        !disabled && (
          <Grid container justifyContent='center'>
            <CircularProgress color='secondary' />
          </Grid>
        )}
    </Grid>
  );
};

export default ExperiencePayoutsView;
