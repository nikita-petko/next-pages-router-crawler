import React, { FunctionComponent, useCallback } from 'react';
import { Button, Divider, Grid, makeStyles, ReportProblemOutlinedIcon, Typography } from '@rbx/ui';
import { AccountStatusEnum } from '@rbx/clients/rightsV1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import EligibilityRow, { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import { www } from '@modules/miscellaneous/common/urls';
import { IP_FAMILY_CREATE_HREF } from '../../../ipFamilies/urls';
import useEligibility from '../../hooks/useEligibility';

const useStyles = makeStyles()(() => ({
  addIPContainer: {
    paddingTop: 16,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  button: {
    left: '50%',
    position: 'absolute',
  },
  first: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
}));

interface EligibilityAdvancedToolingProps {
  accountStatus: string;
}

/**
 * EligibilityAdvancedTooling is an entry point for creating an IP Family.
 */
const EligibilityAdvancedTooling: FunctionComponent<EligibilityAdvancedToolingProps> = ({
  accountStatus,
}) => {
  const onAccountSettingsClick = useCallback(() => {
    window.open(www.getAccountSettingsUrl());
  }, []);
  const { ready, translate } = useTranslation();

  const { auth } = useEligibility();
  const { classes } = useStyles();

  if (!ready) {
    return <PageLoading />;
  }

  const showAdvancedTooling =
    auth?.idVerified && auth?.emailVerified && accountStatus === AccountStatusEnum.Verified;

  return (
    <Grid container direction='column' spacing={3}>
      <Grid item container direction='column'>
        <Grid item>
          <Typography variant='h2'>{translate('Heading.PreReq')}</Typography>
        </Grid>
        <Grid item>
          <Typography variant='body1' color='secondary'>
            {translate('Description.EligibilityAdvancedTooling')}
          </Typography>
        </Grid>
      </Grid>
      <Grid item container direction='column'>
        <Grid item>
          <EligibilityRow
            headerText={translate('Heading.EligibilityIDVerification')}
            status={auth?.idVerified ? EligibilityStatus.Completed : EligibilityStatus.Warning}
            linkText={auth?.idVerified ? undefined : translate('Action.Verify')}
            onClickLink={onAccountSettingsClick}
          />
        </Grid>
        <Grid item>
          <EligibilityRow
            headerText={translate('Heading.EligibilityEmailVerification')}
            status={auth?.emailVerified ? EligibilityStatus.Completed : EligibilityStatus.Warning}
            linkText={auth?.emailVerified ? undefined : translate('Action.Verify')}
            onClickLink={onAccountSettingsClick}
          />
        </Grid>
        <Grid item>
          <EligibilityRow
            headerText={translate('Heading.EligibilityLetterAuthorization')}
            status={
              accountStatus === AccountStatusEnum.Verified
                ? EligibilityStatus.Completed
                : EligibilityStatus.Warning
            }
          />
        </Grid>
      </Grid>
      <Grid item>
        <Divider />
      </Grid>
      {showAdvancedTooling && (
        <Grid item container direction='column'>
          <Grid item>
            <Typography variant='h2'>{translate('Heading.AdvancedTooling')}</Typography>
          </Grid>
          <Grid item container direction='row' className={classes.addIPContainer}>
            <Grid item className={classes.first}>
              <ReportProblemOutlinedIcon color='error' />
              <Typography variant='h6'>{translate('Heading.ProofOwnership')}</Typography>
            </Grid>
            <Grid item className={classes.button}>
              <Button href={IP_FAMILY_CREATE_HREF}>{translate('Action.SetUp')}</Button>
            </Grid>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default withTranslation(EligibilityAdvancedTooling, [TranslationNamespace.RightsPortal]);
