/* istanbul ignore file */

import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import {
  Grid,
  Button,
  TextField,
  useSnackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useMutation } from '@tanstack/react-query';
import { itemconfigurationClient, tryParseResponseError } from '@modules/clients';

interface CreateFolderParams {
  folderName: string;
  groupId?: number;
}

interface UpdateFolderParams {
  folderId: string;
  folderName: string;
}

export interface CreateFolderButtonProps {
  selectedFolderId: string;
  selectedFolderName?: string;
  onFolderCreated: (folderId: string) => void;
  onFolderUpdated: (folderId: string) => void;
  onFolderContentsUpdated: () => void;
  groupId?: number;
}

const CreateFolderButton: FunctionComponent<CreateFolderButtonProps> = ({
  selectedFolderId,
  selectedFolderName,
  onFolderCreated,
  onFolderUpdated,
  onFolderContentsUpdated,
  groupId,
}) => {
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
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

  const createFolderMutation = useMutation({
    mutationFn: async (params: CreateFolderParams) => {
      return itemconfigurationClient.createFolder(params.folderName, undefined, params.groupId);
    },
    onSuccess: (response) => {
      showBottomMsg(translate('Message.CreateFolderSuccess'));
      setNewFolderName('');
      onFolderCreated(response.folderId || '');
      setIsCreateDialogOpen(false);
    },
    onError: async (error) => {
      const errorResponse = await tryParseResponseError(error);
      switch (errorResponse?.code) {
        case 14:
          showBottomMsg(translate('Error.FolderNameModerated'));
          break;
        default:
          showBottomMsg(translate('Error.CreateFolderFailure'));
          break;
      }
    },
  });

  const handleCreateFolder = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }

      if (!newFolderName.trim()) {
        showBottomMsg(translate('Error.FolderNameEmpty'));
        return;
      }

      createFolderMutation.mutate({ folderName: newFolderName.trim(), groupId });
    },
    [newFolderName, groupId, showBottomMsg, createFolderMutation, translate],
  );

  const updateFolderMutation = useMutation({
    mutationFn: async (params: UpdateFolderParams) => {
      return itemconfigurationClient.updateFolder(params.folderId, params.folderName);
    },
    onSuccess: () => {
      showBottomMsg(translate('Message.UpdateFolderSuccess'));
      setNewFolderName('');
      setIsCreateDialogOpen(false);
      onFolderContentsUpdated();
      onFolderUpdated(selectedFolderId);
    },
    onError: async (error) => {
      const errorResponse = await tryParseResponseError(error);
      switch (errorResponse?.code) {
        case 14:
          showBottomMsg(translate('Error.FolderNameModerated'));
          break;
        default:
          showBottomMsg(translate('Error.UpdateFolderFailure'));
          break;
      }
    },
  });

  const handleUpdateFolder = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }

      if (!newFolderName.trim()) {
        showBottomMsg(translate('Error.FolderNameEmpty'));
        return;
      }

      updateFolderMutation.mutate({ folderId: selectedFolderId, folderName: newFolderName.trim() });
    },
    [newFolderName, selectedFolderId, showBottomMsg, updateFolderMutation, translate],
  );

  const createFolderDialog = useMemo(() => {
    const isUpdateMode = !!selectedFolderId;
    const dialogTitle = isUpdateMode
      ? translate('Action.RenameFolder')
      : translate('Action.CreateFolder');
    const submitButtonText = isUpdateMode ? translate('Action.Update') : translate('Action.Create');
    const isSubmitting = isUpdateMode
      ? updateFolderMutation.isPending
      : createFolderMutation.isPending;
    const handleSubmit = isUpdateMode ? handleUpdateFolder : handleCreateFolder;

    return (
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit} id='create-folder-form'>
            <TextField
              id='newFolderName'
              label={translate('Label.FolderName')}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              fullWidth
              autoFocus
              placeholder={translate('Label.FolderName')}
              margin='dense'
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            color='secondary'
            size='large'
            onClick={() => setIsCreateDialogOpen(false)}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            type='submit'
            form='create-folder-form'
            disabled={isSubmitting}
            variant='contained'
            size='large'
            loading={isSubmitting}>
            {submitButtonText}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }, [
    isCreateDialogOpen,
    newFolderName,
    selectedFolderId,
    updateFolderMutation.isPending,
    createFolderMutation.isPending,
    handleUpdateFolder,
    handleCreateFolder,
    translate,
  ]);

  const handleCreateClick = useCallback(() => {
    if (selectedFolderId && selectedFolderName) {
      setNewFolderName(selectedFolderName);
    } else {
      setNewFolderName('');
    }
    setIsCreateDialogOpen(true);
  }, [selectedFolderId, selectedFolderName]);

  return (
    <React.Fragment>
      <Grid item>
        <Button
          variant={selectedFolderId ? 'outlined' : 'contained'}
          size='large'
          onClick={handleCreateClick}>
          {selectedFolderId ? translate('Action.RenameFolder') : translate('Action.CreateFolder')}
        </Button>
      </Grid>
      {createFolderDialog}
    </React.Fragment>
  );
};

export default CreateFolderButton;
