import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
  useSnackbar,
} from '@rbx/ui';
import useAddItemToFolderMutation from '../hooks/useAddItemToFolderMutation';

const isFolderItemType = (
  value: string,
): value is RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum =>
  value === RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset ||
  value === RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Bundle;

export interface AddItemToFolderDialogProps {
  selectedFolderId: string;
  onClose: () => void;
  onFolderContentsUpdated: () => void;
}

// Mounted only while open (by FolderActionsMenu), so the form starts from its defaults on every open
// without a reset effect.
const AddItemToFolderDialog: FunctionComponent<AddItemToFolderDialogProps> = ({
  selectedFolderId,
  onClose,
  onFolderContentsUpdated,
}) => {
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const [itemId, setItemId] = useState<string>('');
  const [itemType, setItemType] =
    useState<RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum>(
      RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset,
    );

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

  const { addItemToFolder, isAddingItem } = useAddItemToFolderMutation({
    onSuccess: () => {
      showBottomMsg(translate('Message.AddItemToFolderSuccess'));
      onFolderContentsUpdated();
      onClose();
    },
    onError: showBottomMsg,
  });

  const handleSubmit = useCallback(
    (event?: React.SyntheticEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }

      if (!itemId.trim()) {
        showBottomMsg(translate('Error.ItemIdEmpty'));
        return;
      }

      addItemToFolder({ itemId: itemId.trim(), itemType, folderId: selectedFolderId });
    },
    [itemId, itemType, selectedFolderId, showBottomMsg, addItemToFolder, translate],
  );

  return (
    <Dialog open onClose={onClose} fullWidth>
      <DialogTitle>{translate('Label.AddItemToFolder')}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} id='add-item-form'>
          <Grid container direction='column' spacing={2} className='padding-top-small'>
            <Grid item>
              <TextField
                id='itemId'
                label={translate('Label.ItemId')}
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                fullWidth
                placeholder={translate('Label.ItemId')}
                margin='dense'
              />
            </Grid>
            <Grid item>
              <Select
                id='itemType'
                label={translate('Label.ItemType')}
                value={itemType}
                onChange={(e) => {
                  const { value } = e.target;
                  if (isFolderItemType(value)) {
                    setItemType(value);
                  }
                }}
                fullWidth
                size='medium'
                variant='outlined'>
                <MenuItem
                  value={RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset}>
                  {translate('Label.Asset')}
                </MenuItem>
                <MenuItem
                  value={RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Bundle}>
                  {translate('Label.Bundle')}
                </MenuItem>
              </Select>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' size='large' onClick={onClose}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          type='submit'
          form='add-item-form'
          disabled={isAddingItem}
          variant='contained'
          size='large'
          loading={isAddingItem}>
          {translate('Action.AddItemToFolder')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemToFolderDialog;
