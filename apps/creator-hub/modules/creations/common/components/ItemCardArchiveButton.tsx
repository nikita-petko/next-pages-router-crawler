import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, useSnackbar, useDialog, DialogTemplate } from '@rbx/ui';
import developClient from '@modules/clients/develop';
import { Item, toastDurationTime } from '@modules/miscellaneous/common';
import type CreationData from '../interfaces/CreationData';
import TrackedMenuItem from './TrackedMenuItem';

export interface ItemCardArchiveButtonProps {
  itemType: Item;
  creation: CreationData;
  removeItem: () => void;
  handleClose: () => void;
  isDisabled?: boolean;
}

const ItemCardArchiveButton: FunctionComponent<
  React.PropsWithChildren<ItemCardArchiveButtonProps>
> = ({ itemType, creation, removeItem, handleClose, isDisabled }) => {
  const [isArchiveUpdating, setIsArchiveUpdating] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();
  const { translate, translateHTML } = useTranslation();
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

  const handleToggleArchived = useCallback(async () => {
    setIsArchiveUpdating(true);
    let archivePromise;
    switch (itemType) {
      case Item.Game:
        archivePromise = developClient.setUniverseConfiguration(
          creation.universeId ?? 0,
          !creation.isArchived,
        );
        break;
      case Item.LibraryAsset:
      default:
        archivePromise = creation.isArchived
          ? developClient.restoreAsset((creation.assetId as number) ?? 0)
          : developClient.archiveAsset((creation.assetId as number) ?? 0);
    }
    try {
      await archivePromise;
      removeItem();
      showBottomMsg(
        creation.isArchived
          ? translate('Message.RestoreSuccess')
          : translate('Message.ArchiveSuccess'),
      );
    } catch {
      showBottomMsg(translate('Response.UnknownError'));
    } finally {
      setIsArchiveUpdating(false);
      handleDialogClose();
      handleClose();
    }
  }, [itemType, creation, removeItem, showBottomMsg, translate, handleClose, handleDialogClose]);

  const confirmArchiveDialog = useMemo(() => {
    return (
      <DialogTemplate
        onConfirm={handleToggleArchived}
        onCancel={closeDialog}
        title={translate('Action.Confirm')}
        content={translateHTML('Description.Archive', null, {
          lineBreak: (
            <>
              <br />
              <br />
            </>
          ),
        })}
        confirmText={translate('Action.OK')}
        cancelText={translate('Action.Cancel')}
        loading={isArchiveUpdating}
      />
    );
  }, [isArchiveUpdating, handleToggleArchived, translate, translateHTML, closeDialog]);

  const handleDialogOpen = useCallback(() => {
    configure(confirmArchiveDialog);
    open();
  }, [confirmArchiveDialog, configure, open]);

  useEffect(() => {
    if (isArchiveUpdating) {
      configure(confirmArchiveDialog);
    }
  }, [isArchiveUpdating, confirmArchiveDialog, configure]);

  const actionKey = creation.isArchived ? 'Action.Restore' : 'Action.Archive';
  return (
    <TrackedMenuItem
      onClick={creation.isArchived || !creation.isActive ? handleToggleArchived : handleDialogOpen}
      disabled={isArchiveUpdating || isDisabled}
      itemKey={actionKey}>
      <Typography>{translate(actionKey)}</Typography>
    </TrackedMenuItem>
  );
};

export default ItemCardArchiveButton;
