import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  useSnackbar,
} from '@rbx/ui';
import useUpdateFolderMutation from '../hooks/useUpdateFolderMutation';

export interface RenameFolderDialogProps {
  selectedFolderId: string;
  selectedFolderName: string;
  onClose: () => void;
  onFolderUpdated: (folderId: string) => void;
  onFolderContentsUpdated: () => void;
}

// Mounted only while open (by FolderActionsMenu), so the field initializes from the current folder
// name on every open without a reset effect.
const RenameFolderDialog: FunctionComponent<RenameFolderDialogProps> = ({
  selectedFolderId,
  selectedFolderName,
  onClose,
  onFolderUpdated,
  onFolderContentsUpdated,
}) => {
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const [newFolderName, setNewFolderName] = useState<string>(selectedFolderName);

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

  const { updateFolder, isUpdatingFolder } = useUpdateFolderMutation({
    onSuccess: () => {
      showBottomMsg(translate('Message.UpdateFolderSuccess'));
      onFolderContentsUpdated();
      onFolderUpdated(selectedFolderId);
      onClose();
    },
    onError: showBottomMsg,
  });

  const handleSubmit = useCallback(
    (event?: React.SyntheticEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }

      if (!newFolderName.trim()) {
        showBottomMsg(translate('Error.FolderNameEmpty'));
        return;
      }

      updateFolder({ folderId: selectedFolderId, folderName: newFolderName.trim() });
    },
    [newFolderName, selectedFolderId, showBottomMsg, updateFolder, translate],
  );

  return (
    <Dialog open onClose={onClose} fullWidth>
      <DialogTitle>{translate('Action.RenameFolder')}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} id='rename-folder-form'>
          <TextField
            id='newFolderName'
            label={translate('Label.FolderName')}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            fullWidth
            placeholder={translate('Label.FolderName')}
            margin='dense'
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' size='large' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          type='submit'
          form='rename-folder-form'
          disabled={isUpdatingFolder}
          variant='contained'
          size='large'
          loading={isUpdatingFolder}>
          {translate('Action.Update')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RenameFolderDialog;
