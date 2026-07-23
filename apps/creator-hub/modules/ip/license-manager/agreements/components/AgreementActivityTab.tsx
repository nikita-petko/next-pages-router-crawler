/* oxlint-disable react/react-compiler -- existing pagination effect syncs local state with fetched activities */
import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AgreementActivityResponse } from '@rbx/client-content-licensing-api/v1';
import { AgreementTransition } from '@rbx/client-content-licensing-api/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import {
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  makeStyles,
  Typography,
  Grid,
  CircularProgress,
} from '@rbx/ui';
import contentLicensingClient from '@modules/clients/contentLicensing';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import ReportIpMessageMenu from '../../../components/ReportIpMessageMenu';
import {
  filterCreatorContentLicensingAgreementActivity,
  filterIphContentLicensingAgreementActivity,
  getLabelFromContentLicensingActivity,
  getNotesBodyFromAgreementActivity,
  getNotesLabelFromAgreementActivity,
  getSpecificActivityExpireDate,
  shouldShowAgreementActivityNotesSection,
} from '../utils/agreementActivity';
import formatDate from '../utils/formatDate';

const ACTIVITY_PAGE_SIZE = 50;

const useStyles = makeStyles()((theme) => ({
  whiteDot: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background:
      theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
    marginLeft: 3,
  },
  loadMoreContainer: {
    textAlign: 'center',
    padding: '0 16px 16px',
  },
  activityStepper: {
    marginBottom: 0,
    paddingBottom: 0,
    '& .MuiStep-root:last-of-type': {
      paddingBottom: 0,
    },
    '& .MuiStep-root:last-of-type .MuiStepContent-root': {
      marginBottom: 0,
      paddingBottom: 0,
    },
  },
}));

const shouldShowReportMenu = (activityTransition: AgreementTransition, isCreator: boolean) => {
  if (isCreator) {
    return (
      activityTransition === AgreementTransition.RejectApplication ||
      activityTransition === AgreementTransition.InitiateChangeRequest
    );
  }
  return activityTransition === AgreementTransition.Apply;
};

const StepIcon = () => {
  const { classes } = useStyles();
  return <span className={classes.whiteDot} />;
};

const getActivityStepKey = (activity: AgreementActivityResponse) =>
  [
    activity.id,
    activity.agreementId,
    activity.transition,
    activity.startStatus,
    activity.endStatus,
    activity.createdAt?.toString(),
  ]
    .filter(Boolean)
    .join('-');

interface AgreementActivityTabProps {
  accountId?: string;
  agreementId?: string;
  activityLog?: AgreementActivityResponse[];
  creatorName?: string;
  listingName?: string;
  isCreator?: boolean;
}

interface AgreementActivityStepperProps {
  activityLog: AgreementActivityResponse[];
  creatorName?: string;
  listingName?: string;
  isCreator: boolean;
  enableIpPlatformConditionalOffers?: boolean;
  nextPageToken?: string;
  isLoadingMoreActivities: boolean;
  onLoadMore?: () => void;
}

const AgreementActivityStepper: FunctionComponent<AgreementActivityStepperProps> = ({
  activityLog,
  creatorName,
  listingName,
  isCreator,
  enableIpPlatformConditionalOffers,
  nextPageToken,
  isLoadingMoreActivities,
  onLoadMore,
}) => {
  const { classes } = useStyles();
  const { locale } = useLocalization();
  const { translate } = useTranslation();

  return (
    <>
      <Stepper orientation='vertical' activeStep={-1} className={classes.activityStepper}>
        {activityLog.map((activity) => (
          <Step key={getActivityStepKey(activity)} completed expanded>
            <StepLabel StepIconComponent={StepIcon}>
              <Typography variant='h6'>
                {translate(
                  getLabelFromContentLicensingActivity(activity, enableIpPlatformConditionalOffers),
                  {
                    creator: creatorName ? `@${creatorName}` : translate('Label.Creator'),
                    ipListing: listingName ?? translate('Label.IpHolder'),
                    date: formatDate(
                      getSpecificActivityExpireDate(activity, enableIpPlatformConditionalOffers),
                      locale ?? Locale.English,
                    ),
                  },
                )}
              </Typography>
              <Typography variant='body2' color='secondary' component='dd'>
                {formatDate(activity.createdAt, locale ?? Locale.English)}
              </Typography>
            </StepLabel>
            {shouldShowAgreementActivityNotesSection(activity) && (
              <StepContent>
                <Grid container direction='row' width='100%' justifyContent='space-between'>
                  <Grid item width='90%'>
                    <Typography
                      variant='smallLabel2'
                      color='secondary'
                      component='dd'
                      marginTop={2}>
                      {translate(
                        getNotesLabelFromAgreementActivity(
                          activity,
                          enableIpPlatformConditionalOffers,
                        ),
                      )}
                    </Typography>
                    <Typography
                      variant='body2'
                      color='secondary'
                      component='dd'
                      whiteSpace='pre-wrap'>
                      {getNotesBodyFromAgreementActivity(
                        activity,
                        translate,
                        listingName ?? translate('Label.IpHolder'),
                      )}
                    </Typography>
                  </Grid>
                  <Grid item width='10%'>
                    {activity.transition &&
                      listingName &&
                      creatorName &&
                      shouldShowReportMenu(activity.transition, isCreator) && (
                        <ReportIpMessageMenu
                          isCreator={isCreator}
                          agreementActivity={activity}
                          listingName={listingName}
                          creatorName={creatorName}
                        />
                      )}
                  </Grid>
                </Grid>
              </StepContent>
            )}
          </Step>
        ))}
      </Stepper>
      {nextPageToken && onLoadMore ? (
        <div className={classes.loadMoreContainer}>
          <Button
            variant='outlined'
            color='secondary'
            disabled={isLoadingMoreActivities}
            onClick={onLoadMore}>
            {isLoadingMoreActivities ? translate('Label.Loading') : translate('Action.LoadMore')}
          </Button>
        </div>
      ) : null}
    </>
  );
};

interface PaginatedAgreementActivityTabProps {
  accountId: string;
  agreementId: string;
  activityLog?: AgreementActivityResponse[];
  creatorName?: string;
  listingName?: string;
  isCreator: boolean;
  enableIpPlatformConditionalOffers?: boolean;
}

/** Fetches paginated activity on mount; remount via `key` when ids change. */
const PaginatedAgreementActivityTab: FunctionComponent<PaginatedAgreementActivityTabProps> = ({
  accountId,
  agreementId,
  activityLog,
  creatorName,
  listingName,
  isCreator,
  enableIpPlatformConditionalOffers,
}) => {
  const { translate } = useTranslation();
  const [paginatedActivityLog, setPaginatedActivityLog] = useState<
    AgreementActivityResponse[] | undefined
  >(undefined);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isLoadingMoreActivities, setIsLoadingMoreActivities] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void contentLicensingClient
      .listAgreementActivities(accountId, agreementId, ACTIVITY_PAGE_SIZE)
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setPaginatedActivityLog(response.activities ?? []);
        setNextPageToken(response.nextPageToken ?? undefined);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setPaginatedActivityLog(activityLog);
        setNextPageToken(undefined);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingActivities(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accountId, agreementId, activityLog]);

  const filteredActivityLog = useMemo(() => {
    return isCreator
      ? filterCreatorContentLicensingAgreementActivity(paginatedActivityLog)
      : filterIphContentLicensingAgreementActivity(paginatedActivityLog);
  }, [paginatedActivityLog, isCreator]);

  const handleLoadMore = useCallback(async () => {
    if (!nextPageToken) {
      return;
    }

    setIsLoadingMoreActivities(true);

    try {
      const response = await contentLicensingClient.listAgreementActivities(
        accountId,
        agreementId,
        ACTIVITY_PAGE_SIZE,
        nextPageToken,
      );
      const additionalActivities = response.activities ?? [];

      setPaginatedActivityLog((currentActivityLog) => [
        ...(currentActivityLog ?? []),
        ...additionalActivities,
      ]);
      setNextPageToken(response.nextPageToken ?? undefined);
    } finally {
      setIsLoadingMoreActivities(false);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- accountId/agreementId are stable; parent remounts via key
  }, [nextPageToken]);

  if (isLoadingActivities && !paginatedActivityLog) {
    return <CircularProgress />;
  }

  if (!filteredActivityLog || filteredActivityLog.length === 0) {
    return (
      <EmptyStateBorder>
        <EmptyState
          title={translate('Label.NoActivityFound')}
          size='small'
          description={translate('Description.NoActivityFound')}
        />
      </EmptyStateBorder>
    );
  }

  return (
    <AgreementActivityStepper
      activityLog={filteredActivityLog}
      creatorName={creatorName}
      listingName={listingName}
      isCreator={isCreator}
      enableIpPlatformConditionalOffers={enableIpPlatformConditionalOffers}
      nextPageToken={nextPageToken}
      isLoadingMoreActivities={isLoadingMoreActivities}
      onLoadMore={handleLoadMore}
    />
  );
};

const AgreementActivityTab: FunctionComponent<AgreementActivityTabProps> = ({
  accountId,
  agreementId,
  activityLog,
  creatorName,
  listingName,
  isCreator = false,
}) => {
  const { translate } = useTranslation();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformConditionalOffers } = settings;

  const filteredActivityLog = useMemo(() => {
    return isCreator
      ? filterCreatorContentLicensingAgreementActivity(activityLog)
      : filterIphContentLicensingAgreementActivity(activityLog);
  }, [activityLog, isCreator]);

  if (!isFetched) {
    return <CircularProgress />;
  }

  if (accountId && agreementId) {
    return (
      <PaginatedAgreementActivityTab
        key={`${accountId}-${agreementId}`}
        accountId={accountId}
        agreementId={agreementId}
        activityLog={activityLog}
        creatorName={creatorName}
        listingName={listingName}
        isCreator={isCreator}
        enableIpPlatformConditionalOffers={enableIpPlatformConditionalOffers}
      />
    );
  }

  if (!filteredActivityLog || filteredActivityLog.length === 0) {
    return (
      <EmptyStateBorder>
        <EmptyState
          title={translate('Label.NoActivityFound')}
          size='small'
          description={translate('Description.NoActivityFound')}
        />
      </EmptyStateBorder>
    );
  }

  return (
    <AgreementActivityStepper
      activityLog={filteredActivityLog}
      creatorName={creatorName}
      listingName={listingName}
      isCreator={isCreator}
      enableIpPlatformConditionalOffers={enableIpPlatformConditionalOffers}
      isLoadingMoreActivities={false}
    />
  );
};

export default AgreementActivityTab;
