import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useSnackbar,
} from '@rbx/ui';
import useDeleteFolderMutation from '../hooks/useDeleteFolderMutation';

export interface DeleteFolderDialogProps {
  selectedFolderId: string;
  onClose: () => void;
  onFolderDeleted: () => void;
}

const DeleteFolderDialog: FunctionComponent<DeleteFolderDialogProps> = ({
  selectedFolderId,
  onClose,
  onFolderDeleted,
}) => {
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

  const { deleteFolder, isDeletingFolder } = useDeleteFolderMutation({
    onSuccess: () => {
      showBottomMsg(translate('Message.DeleteFolderSuccess'));
      onFolderDeleted();
      onClose();
    },
    onError: showBottomMsg,
  });

  const handleConfirm = useCallback(() => {
    deleteFolder(selectedFolderId);
  }, [deleteFolder, selectedFolderId]);

  return (
    <Dialog open onClose={onClose} fullWidth>
      <DialogTitle>{translate('Action.Confirm')}</DialogTitle>
      <DialogContent>
        <Typography>{translate('Message.ConfirmFolderDeletion')}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' size='large' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          color='destructive'
          size='large'
          disabled={isDeletingFolder}
          loading={isDeletingFolder}
          onClick={handleConfirm}>
          {translate('Action.Delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteFolderDialog;
