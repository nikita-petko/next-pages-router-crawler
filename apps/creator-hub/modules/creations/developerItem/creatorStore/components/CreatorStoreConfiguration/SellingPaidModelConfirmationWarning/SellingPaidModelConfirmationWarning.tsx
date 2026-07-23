import React, { FunctionComponent } from 'react';
import { CreatorType } from '@modules/miscellaneous/common';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import CompositeAssetDependenciesAlert from '../../../../common/CompositeAssetDependencies/alert/CompositeAssetDependenciesAlert';
import { DependenciesAlertType } from '../../../../common/CompositeAssetDependencies/constants/alertTypeConstants';
import useSellingPaidModelConfirmationWarningStyles from './SellingPaidModelConfirmationWarning.styles';
import usePaidModelConfirmationData from '../../../hooks/usePaidModelConfirmationData';

const UNAVAILABLE_EVENT_VALUE = 'UNAVAILABLE';

export type SellingPaidModelConfirmationWarningProps = {
  assetId: number;
  creator: { id: number; type: CreatorType };
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const SellingPaidModelConfirmationWarning: FunctionComponent<
  React.PropsWithChildren<SellingPaidModelConfirmationWarningProps>
> = ({ assetId, creator, open, onCancel, onConfirm }) => {
  const { translate } = useTranslation();
  const { classes } = useSellingPaidModelConfirmationWarningStyles();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    assetCreatedUtc,
    assetCreatedBeforeBetaGA,
    assetDependenciesCount,
    creatorAlreadyEnrolled,
  } = usePaidModelConfirmationData({
    assetId,
    creator,
    enabled: true,
  });

  const sendEvent = (eventName: string) => {
    unifiedLogger.logClickEvent({
      eventName,
      parameters: {
        assetId: assetId.toString(),
        assetCreatedBeforeBetaGA: assetCreatedUtc
          ? assetCreatedBeforeBetaGA.toString()
          : UNAVAILABLE_EVENT_VALUE,
        assetCreatedUtc: assetCreatedUtc?.toString() ?? UNAVAILABLE_EVENT_VALUE,
        assetDependenciesCount: assetDependenciesCount?.toString() ?? UNAVAILABLE_EVENT_VALUE,
        enrolledInAssetPrivacyBeta: creatorAlreadyEnrolled.toString(),
      },
    });
  };

  const handleConfirm = () => {
    sendEvent('assetConfiguration.sellingPaidModelConfirmationWarningConfirm');
    onConfirm();
  };

  const handleCancel = () => {
    sendEvent('assetConfiguration.sellingPaidModelConfirmationWarningCancel');
    onCancel();
  };

  const dialogTitle = (() => {
    if (creatorAlreadyEnrolled && assetCreatedBeforeBetaGA) {
      return translate('Label.ModelSaleRestrictedDependenciesConfirmation');
    }
    return translate('Label.ModelSaleConfirmation');
  })();

  return (
    <Dialog
      data-testid='sellingPaidModelConfirmationWarning'
      open={open}
      PaperProps={{ classes: { root: classes.dialogPaper } }}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent classes={{ root: classes.dialogContent }}>
        <CompositeAssetDependenciesAlert
          alertType={DependenciesAlertType.SellingPaidModel}
          parentAssetId={assetId}
          parentCreator={{ id: creator.id, type: creator.type }}
        />
      </DialogContent>
      <DialogActions>
        <Button color='secondary' variant='outlined' onClick={handleCancel}>
          {translate('Action.Cancel')}
        </Button>
        <Button variant='contained' onClick={handleConfirm}>
          {translate('Action.Confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SellingPaidModelConfirmationWarning;
