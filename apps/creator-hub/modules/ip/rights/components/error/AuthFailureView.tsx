import type { ComponentType } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type ErrorType from '../../enums/ErrorType';
import useEligibility from '../../hooks/useEligibility';
import AuthFailureStatus from './AuthFailureStatus';

interface AuthFailureViewProps {
  errorViewComponent: ComponentType<{ errorType: ErrorType; handleReload?: () => void }>;
}

// AuthFailureView is a standalone view to show AMP-denied
export const AuthFailureView = ({ errorViewComponent: ErrorView }: AuthFailureViewProps) => {
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
      <AuthFailureStatus
        auth={auth}
        isLoading={isLoading}
        error={error}
        errorViewComponent={ErrorView}
      />
    </Grid>
  );
};

export default withTranslation(AuthFailureView, [TranslationNamespace.RightsPortal]);
