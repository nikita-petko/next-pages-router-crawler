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
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { toastDurationTime } from '@modules/miscellaneous/common';
import {
  useCreateFolderMutation,
  useUpdateFolderMutation,
} from '@modules/react-query/itemConfiguration/itemConfigurationQueries';

const FolderNameModeratedErrorCode = 14;
const TooManyFoldersErrorCode = 20;

export interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  groupId?: number;
  /** When provided, the dialog renames this folder instead of creating a new one. */
  folderId?: string;
  /** Initial value for the name field (used to prefill in rename mode). */
  initialName?: string;
  onFolderCreated?: (folderId: string) => void;
  onFolderRenamed?: (folderId: string) => void;
}

const CreateFolderDialog: FunctionComponent<React.PropsWithChildren<CreateFolderDialogProps>> = ({
  open,
  onClose,
  groupId,
  folderId,
  initialName,
  onFolderCreated,
  onFolderRenamed,
}) => {
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const isRenameMode = folderId !== undefined && folderId.length > 0;
  // The dialog is only mounted while open (see call sites), so the field initializes fresh from
  // initialName on each open — no reset effect needed.
  const [folderName, setFolderName] = useState<string>(initialName ?? '');

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

  const showFolderNameError = useCallback(
    async (error: unknown, fallbackMessage: string) => {
      const errorResponse = await tryParseResponseError(error);
      if (errorResponse?.code === FolderNameModeratedErrorCode) {
        showBottomMsg(translate('Error.FolderNameModerated'));
        return;
      }
      if (errorResponse?.code === TooManyFoldersErrorCode) {
        showBottomMsg(translate('Error.TooManyFolders'));
        return;
      }
      showBottomMsg(fallbackMessage);
    },
    [showBottomMsg, translate],
  );

  const { mutate: createFolder, isPending: isCreating } = useCreateFolderMutation(
    itemconfigurationClient,
    {
      onSuccess: (createdFolderId) => {
        showBottomMsg(translate('Message.CreateFolderSuccess'));
        onFolderCreated?.(createdFolderId);
        onClose();
      },
      onError: (error) => showFolderNameError(error, translate('Error.CreateFolderFailure')),
    },
  );

  const { mutate: renameFolder, isPending: isRenaming } = useUpdateFolderMutation(
    itemconfigurationClient,
    {
      onSuccess: () => {
        showBottomMsg(translate('Message.UpdateFolderSuccess'));
        onFolderRenamed?.(folderId ?? '');
        onClose();
      },
      onError: (error) => showFolderNameError(error, translate('Error.UpdateFolderFailure')),
    },
  );

  const isPending = isRenameMode ? isRenaming : isCreating;

  const handleSubmit = useCallback(
    (event?: React.SyntheticEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }
      const trimmed = folderName.trim();
      if (!trimmed) {
        showBottomMsg(translate('Error.FolderNameEmpty'));
        return;
      }
      if (isRenameMode) {
        renameFolder({ folderId: folderId ?? '', name: trimmed });
      } else {
        createFolder({ name: trimmed, groupId });
      }
    },
    [
      folderName,
      isRenameMode,
      renameFolder,
      createFolder,
      showBottomMsg,
      translate,
      folderId,
      groupId,
    ],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        {isRenameMode ? translate('Action.RenameFolder') : translate('Action.CreateFolder')}
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} id='create-folder-form'>
          <TextField
            id='folderName'
            label={translate('Label.FolderName')}
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            // Stop keystrokes from bubbling to a parent context menu's type-ahead handler when the
            // dialog is opened from within the item context menu, but let Escape through so it can
            // still close the dialog.
            onKeyDown={(e) => {
              if (e.key !== 'Escape') {
                e.stopPropagation();
              }
            }}
            fullWidth
            margin='dense'
            placeholder={translate('Label.FolderName')}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' size='large' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          type='submit'
          form='create-folder-form'
          variant='contained'
          size='large'
          disabled={isPending}
          loading={isPending}>
          {isRenameMode ? translate('Action.Update') : translate('Action.Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateFolderDialog;
