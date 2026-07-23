import React, { FunctionComponent, useCallback, useState, useMemo, useEffect } from 'react';
import { DialogTemplate, Typography, useDialog, useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { developClient } from '@modules/clients';
import CreationData from '../interfaces/CreationData';
import TrackedMenuItem from './TrackedMenuItem';

export interface ItemCardPrivacyButtonProps {
  creation: CreationData;
  updateItemPrivacy: (isActive: boolean) => void;
  handleClose: () => void;
  isDisabled?: boolean;
}

const ItemCardPrivacyButton: FunctionComponent<
  React.PropsWithChildren<ItemCardPrivacyButtonProps>
> = ({ creation, updateItemPrivacy, handleClose, isDisabled }) => {
  const [isPrivacyUpdating, setIsPrivacyUpdating] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();

  const showBottomMsg = useCallback(
    (msg: string) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const handleDialogClose = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const handleTogglePrivacy = useCallback(async () => {
    setIsPrivacyUpdating(true);
    const privacyPromise = creation.isActive
      ? developClient.deactivateGame(creation.universeId ?? 0)
      : developClient.activateGame(creation.universeId ?? 0);
    try {
      await privacyPromise;
      updateItemPrivacy(!creation.isActive);
      showBottomMsg(translate('Message.PrivacyUpdateSuccess'));
    } catch {
      showBottomMsg(translate('Response.UnknownError'));
    } finally {
      setIsPrivacyUpdating(false);
      handleDialogClose();
      handleClose();
    }
  }, [creation, handleDialogClose, showBottomMsg, translate, handleClose, updateItemPrivacy]);

  const confirmMakePrivateDialog = useMemo(() => {
    return (
      <DialogTemplate
        onConfirm={handleTogglePrivacy}
        onCancel={closeDialog}
        title={translate('Action.Confirm')}
        content={translate('Description.MakePrivate')}
        confirmText={translate('Action.OK')}
        cancelText={translate('Action.Cancel')}
        loading={isPrivacyUpdating}
      />
    );
  }, [isPrivacyUpdating, handleTogglePrivacy, translate, closeDialog]);

  const handleDialogOpen = useCallback(() => {
    configure(confirmMakePrivateDialog);
    open();
  }, [confirmMakePrivateDialog, open, configure]);

  useEffect(() => {
    if (isPrivacyUpdating) {
      configure(confirmMakePrivateDialog);
    }
  }, [isPrivacyUpdating, confirmMakePrivateDialog, configure]);
  const actionKey = creation.isActive ? 'Action.MakePrivate' : 'Action.MakePublic';

  return (
    <TrackedMenuItem
      onClick={creation.isActive ? handleDialogOpen : handleTogglePrivacy}
      itemKey={actionKey}
      disabled={isPrivacyUpdating || isDisabled}>
      <Typography>{translate(actionKey)}</Typography>
    </TrackedMenuItem>
  );
};

export default ItemCardPrivacyButton;
