import React, { FunctionComponent } from 'react';
import { Alert, AlertTitle, Link } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { urls, Asset } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useAudioDistributionStyles from './AudioDistribution.styles';
import { EDistributionStatus } from '../hooks/getDistributionStatus';

const {
  creatorHub: { dashboard },
} = urls;
type AlertColor = 'error' | 'info' | 'success';

export type DistributionStatusModalProps = {
  status: EDistributionStatus | undefined;
};

const DistributionStatusModal: FunctionComponent<
  React.PropsWithChildren<DistributionStatusModalProps>
> = ({ status }) => {
  const { translate } = useTranslation();
  const { classes: styles } = useAudioDistributionStyles();

  let severity: AlertColor;
  let headerText = '';
  let infoText = '';
  let showViewAssetsButton = false;
  switch (status) {
    case EDistributionStatus.Pending:
      severity = 'info';
      headerText = translate('Label.DistributionPending');
      infoText = translate('Message.DistributionPending');
      showViewAssetsButton = true;
      break;
    case EDistributionStatus.Approved:
      severity = 'success';
      headerText = translate('Label.DistributionApproved');
      infoText = translate('Message.DistributionApproved');
      showViewAssetsButton = true;
      break;
    case EDistributionStatus.Failed:
      severity = 'error';
      headerText = translate('Label.OnboardingFailed');
      infoText = translate('Message.OnboardingFailed');
      break;
    default:
      severity = 'info';
      headerText = translate('');
      infoText = translate('');
  }

  return (
    <Alert
      action={
        showViewAssetsButton ? (
          <Link
            className={styles.alertLink}
            data-testid='distribution-status-action'
            href={dashboard.getUrl(undefined, Asset.Audio, Asset.Audio)}>
            {translate('Action.ViewAudioAssets')}
          </Link>
        ) : null
      }
      className={styles.distributionStatusContainer}
      data-testid='distribution-status-alert'
      severity={severity}
      variant='standard'>
      <AlertTitle>{headerText}</AlertTitle>
      {infoText}
    </Alert>
  );
};

export default withTranslation(DistributionStatusModal, [
  TranslationNamespace.MarketplaceOnboarding,
]);
