import { Grid, Typography } from '@rbx/ui';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import useEligibility from '../../hooks/useEligibility';
import AuthFailureStatus from './AuthFailureStatus';

// AuthFailureView is a standalone view to show AMP-denied
export const AuthFailureView = () => {
  const { ready, translate } = useTranslation();
  const { auth, isLoading, error } = useEligibility();

  if (isLoading || !ready) {
    return <PageLoading />;
  }

  return (
    <Grid container direction='column'>
      <Grid item>
        <Typography variant='h1'>{translate('Heading.EligibilityRequirements')}</Typography>
      </Grid>
      <Grid item>
        <Typography variant='body1'>{translate('Description.EligibilityRequirements')}</Typography>
      </Grid>
      <AuthFailureStatus auth={auth} isLoading={isLoading} error={error} />
    </Grid>
  );
};

export default withTranslation(AuthFailureView, [TranslationNamespace.RightsPortal]);
