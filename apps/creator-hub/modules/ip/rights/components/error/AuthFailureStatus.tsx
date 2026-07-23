import EligibilityRow, { EligibilityStatus } from '@modules/eligibility/components/EligibilityRow';
import { urls } from '@modules/miscellaneous/common';
import { AuthorizationStatus } from '@rbx/clients/rightsV1';
import { Grid } from '@rbx/ui';
import { useRouter } from 'next/router';
import React, { useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ErrorType from '../../enums/ErrorType';
import RightsApiErrorView from './RightsApiErrorView';

const { www } = urls;
export interface AuthFailureStatusProps {
  auth?: AuthorizationStatus;
  isLoading: boolean;
  error: ErrorType;
}
/**
 * AuthFailureStatus shows authorizationstatus from AMP. It should NOT be used stand-alone,
 * please pair it with context.
 */
const AuthFailureStatus = ({ auth, isLoading, error }: AuthFailureStatusProps) => {
  const toAccountSettings = useCallback(() => {
    window.open(www.getAccountSettingsUrl());
  }, []);
  const router = useRouter();
  const { ready, translate } = useTranslation();

  if (isLoading || !ready) {
    return null;
  }

  if (error !== ErrorType.None) {
    return <RightsApiErrorView errorType={error} handleReload={router.reload} />;
  }

  // no error but no eligibility given... something's wrong.
  if (!auth) {
    return <RightsApiErrorView errorType={ErrorType.ServerError} handleReload={router.reload} />;
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
