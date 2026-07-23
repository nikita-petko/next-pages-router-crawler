import { FunctionComponent, useMemo } from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  makeStyles,
  Typography,
  Grid,
  CircularProgress,
} from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import {
  AgreementActivityResponse,
  AgreementTransition,
} from '@rbx/clients/contentLicensingApi/v1';
import { useSettings } from '@modules/settings';

import {
  filterCreatorContentLicensingAgreementActivity,
  filterIphContentLicensingAgreementActivity,
  getLabelFromContentLicensingActivity,
  getNotesBodyFromAgreementActivity,
  getNotesLabelFromAgreementActivity,
  getSpecificActivityExpireDate,
} from '../utils/agreementActivity';
import ReportIpMessageMenu from '../../../components/ReportIpMessageMenu';
import { TimelimitedDateRange } from '../../utils/timeLimitedLicense';

const useStyles = makeStyles()((theme) => ({
  whiteDot: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background:
      theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
    marginLeft: 3,
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

interface AgreementActivityTabProps {
  activityLog?: AgreementActivityResponse[];
  creatorName?: string;
  listingName?: string;
  isCreator?: boolean;
  dateRange?: TimelimitedDateRange;
}

const AgreementActivityTab: FunctionComponent<AgreementActivityTabProps> = ({
  activityLog,
  creatorName,
  listingName,
  isCreator = false,
  dateRange,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const filteredActivityLog = useMemo(() => {
    return isCreator
      ? filterCreatorContentLicensingAgreementActivity(activityLog)
      : filterIphContentLicensingAgreementActivity(activityLog);
  }, [activityLog, isCreator]);

  if (!isFetched) {
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
    <Stepper orientation='vertical' activeStep={-1}>
      {filteredActivityLog.map((activity) => (
        <Step key={activity.id} completed expanded>
          <StepLabel StepIconComponent={StepIcon}>
            <Typography variant='h6'>
              {translate(
                getLabelFromContentLicensingActivity(activity, enableIpPlatformTimeboundLicenses),
                {
                  creator: creatorName ? `@${creatorName}` : translate('Label.Creator'),
                  ipListing: listingName ?? translate('Label.IpHolder'),
                  date:
                    getSpecificActivityExpireDate(
                      activity,
                      dateRange,
                      enableIpPlatformTimeboundLicenses,
                    )?.toLocaleDateString(locale ?? Locale.English, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }) ?? '',
                },
              )}
            </Typography>
            <Typography variant='body2' color='secondary' component='dd'>
              {new Date(activity.createdAt!).toLocaleDateString(locale ?? Locale.English, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </StepLabel>
          {activity.notes && (
            <StepContent>
              <Grid container direction='row' width='100%' justifyContent='space-between'>
                <Grid item width='90%'>
                  <Typography variant='smallLabel2' color='secondary' component='dd' marginTop={2}>
                    {translate(
                      getNotesLabelFromAgreementActivity(
                        activity,
                        enableIpPlatformTimeboundLicenses,
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
                      enableIpPlatformTimeboundLicenses,
                    )}
                  </Typography>
                </Grid>
                <Grid item width='10%'>
                  {shouldShowReportMenu(activity.transition!, isCreator) && (
                    <ReportIpMessageMenu
                      isCreator={isCreator}
                      agreementActivity={activity}
                      listingName={listingName!}
                      creatorName={creatorName!}
                    />
                  )}
                </Grid>
              </Grid>
            </StepContent>
          )}
        </Step>
      ))}
    </Stepper>
  );
};

export default AgreementActivityTab;
