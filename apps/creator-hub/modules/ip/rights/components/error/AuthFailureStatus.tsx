import { useRouter } from 'next/router';
import { useCallback, type ComponentType } from 'react';
import type { AuthorizationStatus } from '@rbx/client-rights/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import EligibilityRow, { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { www } from '@modules/miscellaneous/urls';
import ErrorType from '../../enums/ErrorType';

export interface AuthFailureStatusProps {
  auth?: AuthorizationStatus;
  isLoading: boolean;
  error: ErrorType;
  errorViewComponent: ComponentType<{ errorType: ErrorType; handleReload?: () => void }>;
}
/**
 * AuthFailureStatus shows authorizationstatus from AMP. It should NOT be used stand-alone,
 * please pair it with context.
 */
const AuthFailureStatus = ({
  auth,
  isLoading,
  error,
  errorViewComponent: ErrorView,
}: AuthFailureStatusProps) => {
  const toAccountSettings = useCallback(() => {
    window.open(www.getAccountSettingsUrl());
  }, []);
  const router = useRouter();
  const { ready, translate } = useTranslation();

  if (isLoading || !ready) {
    return null;
  }

  if (error !== ErrorType.None) {
    return <ErrorView errorType={error} handleReload={router.reload} />;
  }

  // no error but no eligibility given... something's wrong.
  if (!auth) {
    return <ErrorView errorType={ErrorType.ServerError} handleReload={router.reload} />;
  }

  return (
    <Grid container direction='column' spacing={3} padding={3}>
      <Grid item>
        <EligibilityRow
          headerText={translate('Heading.EligibilityIDVerification')}
          status={auth.idVerified ? EligibilityStatus.Completed : EligibilityStatus.Warning}
          descriptionText={translate('Description.EligibilityIDVerification')}
          linkText={auth.idVerified ? undefined : translate('Action.Verify')}
          onClickLink={toAccountSettings}
        />
      </Grid>
      <Grid item>
        <EligibilityRow
          headerText={translate('Heading.EligibilityEmailVerification')}
          status={auth.emailVerified ? EligibilityStatus.Completed : EligibilityStatus.Warning}
          descriptionText={translate('Description.IPPlatformEligibilityEmailVerification')}
          linkText={auth.emailVerified ? undefined : translate('Action.Verify')}
          onClickLink={toAccountSettings}
        />
      </Grid>
    </Grid>
  );
};

export default withTranslation(AuthFailureStatus, [TranslationNamespace.RightsPortal]);
