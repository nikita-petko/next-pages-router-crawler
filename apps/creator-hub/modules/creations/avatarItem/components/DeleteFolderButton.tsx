/* istanbul ignore file */

import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Grid, Button, useSnackbar, useDialog, DialogTemplate } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useMutation } from '@tanstack/react-query';
import { itemconfigurationClient } from '@modules/clients';

export interface DeleteFolderButtonProps {
  selectedFolderId: string;
  onFolderDeleted: () => void;
}

const DeleteFolderButton: FunctionComponent<DeleteFolderButtonProps> = ({
  selectedFolderId,
  onFolderDeleted,
}) => {
  const { open, close: closeDialog, configure } = useDialog();
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();

  const showBottomMsg = useCallback(
    (msg: string) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: 3000,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const handleDialogClose = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      return itemconfigurationClient.deleteFolder(folderId);
    },
    onSuccess: () => {
      showBottomMsg(translate('Message.DeleteFolderSuccess'));
      onFolderDeleted();
      handleDialogClose();
    },
    onError: () => {
      showBottomMsg(translate('Message.DeleteFolderFailure'));
    },
  });

  const handleDeleteFolder = useCallback(() => {
    deleteFolderMutation.mutate(selectedFolderId);
  }, [deleteFolderMutation, selectedFolderId]);

  const confirmDeleteDialog = useMemo(() => {
    return (
      <DialogTemplate
        onConfirm={handleDeleteFolder}
        onCancel={handleDialogClose}
        title={translate('Action.Confirm')}
        content={translate('Message.ConfirmFolderDeletion')}
        confirmText={translate('Action.Delete')}
        cancelText={translate('Action.Cancel')}
        loading={deleteFolderMutation.isPending}
        color='destructive'
      />
    );
  }, [handleDeleteFolder, handleDialogClose, translate, deleteFolderMutation.isPending]);

  const handleDeleteClick = useCallback(() => {
    configure(confirmDeleteDialog);
    open();
  }, [configure, confirmDeleteDialog, open]);

  return (
    <Grid item>
      <Button variant='contained' size='large' color='destructive' onClick={handleDeleteClick}>
        {translate('Action.DeleteFolder')}
      </Button>
    </Grid>
  );
};

export default DeleteFolderButton;
