import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, DialogTemplate, MenuItem, Typography, useDialog, useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { experienceSubscriptionsClient } from '@modules/clients';
import { ProductStatusType } from '@rbx/clients/developerSubscriptionsApi';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CreationData from '../../../common/interfaces/CreationData';

type Props = {
  creation: CreationData;
  handleClose: () => void;
  updateItem: (item: CreationData) => void;
};

function ItemCardExperienceSubscriptionDeactivationButton({
  creation,
  handleClose,
  updateItem,
}: Props) {
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate } = useTranslation();
  const { open, close: closeDialog, configure } = useDialog();
  const [isDeactivating, setIsDeactivating] = useState(false);

  const showCenterMsg = useCallback(
    (msg: string, isSuccessful: boolean) => {
      enqueue({
        children: <Alert severity={isSuccessful ? 'success' : 'error'}>{msg}</Alert>,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const deactivateExperienceSubscription = useCallback(async () => {
    setIsDeactivating(true);
    const subProductId = creation.subscriptionProductId?.startsWith('EXP-')
      ? creation.subscriptionProductId.substring(4)
      : creation.subscriptionProductId;

    try {
      const { success } = await experienceSubscriptionsClient.deactivateExperienceSubscription(
        creation.universeId ?? 0,
        subProductId ?? '',
        true,
      );
      if (success) {
        updateItem({ ...creation, productStatus: 1 });
        showCenterMsg(translate('Message.DeactivateSubscriptionSuccess'), success);
      } else {
        showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
      }
    } catch {
      showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
    }
    setIsDeactivating(false);
    closeDialog();
    handleClose();
  }, [creation, closeDialog, handleClose, updateItem, showCenterMsg, translate]);

  const confirmMakeDeactivationDialog = useMemo(() => {
    return (
      <DialogTemplate
        onConfirm={deactivateExperienceSubscription}
        onCancel={closeDialog}
        title={translate('Heading.DeactivateSubscription')}
        content={
          <Typography color='primary'>
            {translate('Message.DeactivateSubscriptionPrompt', {
              name: creation.name ?? '',
            })}
          </Typography>
        }
        confirmText={translate('Action.Deactivate')}
        cancelText={translate('Action.Cancel')}
        loading={isDeactivating}
      />
    );
  }, [deactivateExperienceSubscription, isDeactivating, closeDialog, translate, creation.name]);

  const handleDialogOpen = useCallback(() => {
    configure(confirmMakeDeactivationDialog);
    open();
  }, [configure, confirmMakeDeactivationDialog, open]);

  useEffect(() => {
    if (isDeactivating) {
      configure(confirmMakeDeactivationDialog);
    }
  }, [isDeactivating, confirmMakeDeactivationDialog, configure]);

  if (creation.productStatus !== ProductStatusType.OffSale) {
    return null;
  }

  return (
    <MenuItem key='Action.Deactivate' onClick={handleDialogOpen}>
      <Typography>{translate('Action.DeactivateOffSale')}</Typography>
    </MenuItem>
  );
}

export default withTranslation(ItemCardExperienceSubscriptionDeactivationButton, [
  TranslationNamespace.ExperienceSubscriptions,
  TranslationNamespace.Creations,
]);
