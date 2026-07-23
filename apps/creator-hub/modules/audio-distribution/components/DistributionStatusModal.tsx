import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, Link } from '@rbx/ui';
import { Asset } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { EDistributionStatus } from '../hooks/getDistributionStatus';
import useAudioDistributionStyles from './AudioDistribution.styles';

const { dashboard } = creatorHub;
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
