import { FunctionComponent, useCallback, useMemo } from 'react';
import { Button, Grid, makeStyles, OpenInNewIcon, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { PageLoading } from '@modules/miscellaneous/common';
import { useRouter } from 'next/router';
import { www } from '@modules/miscellaneous/common/urls';
import { useSettings } from '@modules/settings';
import { Requirements } from '@rbx/clients/affiliateLinksApi';
import { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import { useAuthentication } from '@modules/authentication/providers';
import { getRequirements } from '@modules/react-query/affiliateLinks/affiliateLinksRequests';
import { useQuery } from '@tanstack/react-query';
import { eligibilitySettingsLinkCreatorRewards } from '../constants/links';
import {
  EligibilityCheckProps,
  EligibilityCheckType,
} from '../constants/AffiliateProgramChecksConstants';
import AffiliateProgramEligibilityRow from './AffiliateProgramEligibilityRow';

const useAffiliateProgramChecksStyles = makeStyles()((theme) => ({
  cardContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    background: theme.palette.surface[200],
    borderRadius: '8px',
    paddingRight: '16px',
    paddingBottom: '16px',
    margin: 0,
  },
  eligibilityContainer: {
    paddingLeft: '16px',
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  subheaderText: {
    color: theme.palette.content.muted,
  },
  iconButton: {
    padding: 0,
  },
}));

interface AffiliateProgramChecksProps {
  isCardComponent?: boolean;
}

const AffiliateProgramChecks: FunctionComponent<AffiliateProgramChecksProps> = ({
  isCardComponent = false,
}: AffiliateProgramChecksProps) => {
  const { ready: areTranslationsReady, translate } = useTranslation();

  const { classes } = useAffiliateProgramChecksStyles();
  const { user } = useAuthentication();

  const router = useRouter();
  const { isFetched: isSettingsFetched } = useSettings();

  const { data: requirementsResponse, isLoading } = useQuery({
    queryKey: ['affiliateLinkRequirements', user?.id],
    queryFn: getRequirements,
  });

  const requirements = useMemo(
    () => requirementsResponse?.requirements ?? [],
    [requirementsResponse],
  );

  const onClickVerifyLink = useCallback(() => {
    window.open(www.getAccountSettingsUrl());
  }, []);

  const onEligibilitySettingsClick = useCallback(() => {
    router.push(eligibilitySettingsLinkCreatorRewards);
  }, [router]);

  const areEligibilityChecksLoading = !areTranslationsReady || isLoading;

  const isIdVerified =
    !requirements?.includes(Requirements.Id) && !requirements?.includes(Requirements.Restricted);
  const isModerationHistoryClean = !requirements?.includes(Requirements.ModerationStatus);

  const eligibilityCheckPropsMap = useMemo(() => {
    return new Map<EligibilityCheckType, EligibilityCheckProps>([
      [
        EligibilityCheckType.Id,
        {
          status: isIdVerified ? EligibilityStatus.Completed : EligibilityStatus.Warning,
          verifyLink: isCardComponent || isIdVerified ? undefined : onClickVerifyLink,
          isOpenInNewLink: true,
        },
      ],
      [
        EligibilityCheckType.Moderation,
        {
          status: isModerationHistoryClean
            ? EligibilityStatus.Completed
            : EligibilityStatus.Warning,
        },
      ],
    ]);
  }, [isCardComponent, isIdVerified, isModerationHistoryClean, onClickVerifyLink]);

  if (areEligibilityChecksLoading || !isSettingsFetched) {
    return <PageLoading />;
  }

  return (
    <Grid
      container
      item
      XSmall={12}
      spacing={isCardComponent ? 2 : 4}
      className={isCardComponent ? classes.cardContainer : classes.eligibilityContainer}>
      {isCardComponent ? (
        <Grid item className={classes.headerContainer}>
          <Typography variant='h5' component='h5'>
            {translate('Heading.StartEarningRevenue')}
          </Typography>
          <Typography variant='body2' component='p' className={classes.subheaderText}>
            {translate('Description.StartEarningRevenue')}
          </Typography>
        </Grid>
      ) : null}
      {Object.values(EligibilityCheckType).map((check) => {
        return (
          <AffiliateProgramEligibilityRow
            key={check}
            eligibilityCheckType={check}
            isCardComponent={isCardComponent}
            {...eligibilityCheckPropsMap.get(check)!}
          />
        );
      })}
      {isCardComponent ? (
        <Grid item>
          <Button
            color='secondary'
            variant='contained'
            onClick={onEligibilitySettingsClick}
            endIcon={<OpenInNewIcon />}>
            {translate('Action.EligibilitySettings')}
          </Button>
        </Grid>
      ) : null}
    </Grid>
  );
};

export default AffiliateProgramChecks;
