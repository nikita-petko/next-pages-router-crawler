import type { FunctionComponent } from 'react';
import React from 'react';
import { RobloxPaymentsSharedV1SellerStatus as SellerStatus } from '@rbx/client-marketplace-fiat-service/v1';
import { useTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Link } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { creatorHub } from '@modules/miscellaneous/urls';
import useOnboardingStatusAlertStyles from './OnboardingStatusAlert.styles';

const { dashboard } = creatorHub;
type AlertColor = 'error' | 'info' | 'success' | 'warning';

export type OnboardingStatusAlertProps = {
  handleRedirectToOnboarding: () => void;
  status: SellerStatus | undefined;
};

const OnboardingStatusAlert: FunctionComponent<
  React.PropsWithChildren<OnboardingStatusAlertProps>
> = ({ handleRedirectToOnboarding, status }) => {
  const { translate } = useTranslation();
  const { classes: styles } = useOnboardingStatusAlertStyles();

  let severity: AlertColor;
  let headerText = '';
  let infoText = '';
  let showViewAssetsButton = false;
  let showEditAccountButton = false;
  switch (status) {
    case SellerStatus.Complete:
      severity = 'success';
      headerText = translate('Label.OnboardingApproved');
      infoText = translate('Message.OnboardingApproved');
      showViewAssetsButton = true;
      break;
    case SellerStatus.Enabled:
      severity = 'success';
      headerText = translate('Label.OnboardingEnabled');
      infoText = translate('Message.OnboardingEnabled');
      showViewAssetsButton = true;
      break;
    case SellerStatus.Rejected:
      severity = 'error';
      headerText = translate('Label.OnboardingFailed');
      infoText = translate('Message.OnboardingFailed');
      break;
    case SellerStatus.Restricted:
      severity = 'error';
      headerText = translate('Label.OnboardingRestricted');
      infoText = translate('Message.OnboardingRestricted');
      showEditAccountButton = true;
      break;
    case SellerStatus.RestrictedSoon:
      severity = 'error';
      headerText = translate('Label.OnboardingRestrictedSoon');
      infoText = translate('Message.OnboardingRestrictedSoon');
      showEditAccountButton = true;
      break;
    case SellerStatus.Pending:
      severity = 'info';
      headerText = translate('Label.OnboardingInReview');
      infoText = translate('Message.OnboardingInReview');
      break;
    default:
      severity = 'info';
      headerText = translate('');
      infoText = translate('');
  }

  let alertComponent;
  if (showViewAssetsButton) {
    alertComponent = (
      <Link
        className={styles.alertLink}
        href={dashboard.getUrl(undefined, Asset.Model, Asset.Model)}>
        {translate('Action.ViewAssets')}
      </Link>
    );
  } else if (showEditAccountButton) {
    alertComponent = (
      <Link className={styles.alertLink} component='button' onClick={handleRedirectToOnboarding}>
        {translate('Action.EditInformation')}
      </Link>
    );
  }

  return (
    <Alert
      action={alertComponent}
      className={styles.onboardingIndicatorContainer}
      data-testid='onboarding-status-alert'
      icon={false}
      severity={severity}
      variant='standard'>
      <AlertTitle>{headerText}</AlertTitle>
      {infoText}
    </Alert>
  );
};

export default OnboardingStatusAlert;
