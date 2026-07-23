/* istanbul ignore file */

import React, { FunctionComponent, useCallback, useMemo, useState } from 'react';
import {
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  useSnackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useMutation } from '@tanstack/react-query';
import { itemconfigurationClient, tryParseResponseError } from '@modules/clients';
import { RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum } from '@rbx/client-itemconfiguration/v1';

interface AddItemToFolderParams {
  itemId: string;
  itemType: RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum;
  folderId: string;
}

export interface AddItemToFolderButtonProps {
  selectedFolderId: string;
  onFolderContentsUpdated: () => void;
}

const AddItemToFolderButton: FunctionComponent<AddItemToFolderButtonProps> = ({
  selectedFolderId,
  onFolderContentsUpdated,
}) => {
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState<boolean>(false);
  const [itemId, setItemId] = useState<string>('');
  const [itemType, setItemType] =
    useState<RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum>(
      RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum.Asset,
    );
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

  const addItemToFolderMutation = useMutation({
    mutationFn: async (params: AddItemToFolderParams) => {
      return itemconfigurationClient.addItemToFolder(
        params.itemId,
        params.itemType,
        params.folderId,
      );
    },
    onSuccess: () => {
      showBottomMsg(translate('Message.AddItemToFolderSuccess'));
      setItemId('');
      setItemType(RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum.Asset);
      setIsAddItemDialogOpen(false);
      onFolderContentsUpdated();
    },
    onError: async (error) => {
      const errorResponse = await tryParseResponseError(error);
      switch (errorResponse?.code) {
        case 3:
          showBottomMsg(translate('Error.ItemIdInvalid'));
          break;
        case 9:
          showBottomMsg(translate('Error.ItemNotOwned'));
          break;
        case 6:
          showBottomMsg(translate('Message.ItemNotFound'));
          break;
        default:
          showBottomMsg(translate('Error.AddItemToFolderFailure'));
          break;
      }
    },
  });

  const handleAddItemToFolder = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }

      if (!itemId.trim()) {
        showBottomMsg(translate('Error.ItemIdEmpty'));
        return;
      }

      addItemToFolderMutation.mutate({
        itemId: itemId.trim(),
        itemType,
        folderId: selectedFolderId,
      });
    },
    [itemId, itemType, selectedFolderId, showBottomMsg, addItemToFolderMutation, translate],
  );

  const addItemDialog = useMemo(() => {
    return (
      <Dialog open={isAddItemDialogOpen} onClose={() => setIsAddItemDialogOpen(false)} fullWidth>
        <DialogTitle>{translate('Label.AddItemToFolder')}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleAddItemToFolder} id='add-item-form'>
            <Grid container direction='column' spacing={2} style={{ paddingTop: '8px' }}>
              <Grid item>
                <TextField
                  id='itemId'
                  label={translate('Label.ItemId')}
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  fullWidth
                  autoFocus
                  placeholder={translate('Label.ItemId')}
                  margin='dense'
                />
              </Grid>
              <Grid item>
                <Select
                  id='itemType'
                  label={translate('Label.ItemType')}
                  value={itemType}
                  onChange={(e) =>
                    setItemType(
                      e.target
                        .value as RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum,
                    )
                  }
                  fullWidth
                  size='medium'
                  variant='outlined'>
                  <MenuItem
                    value={
                      RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum.Asset
                    }>
                    {translate('Label.Asset')}
                  </MenuItem>
                  <MenuItem
                    value={
                      RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum.Bundle
                    }>
                    {translate('Label.Bundle')}
                  </MenuItem>
                </Select>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            color='secondary'
            size='large'
            onClick={() => setIsAddItemDialogOpen(false)}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            type='submit'
            form='add-item-form'
            disabled={addItemToFolderMutation.isPending}
            variant='contained'
            size='large'
            loading={addItemToFolderMutation.isPending}>
            {translate('Action.AddItemToFolder')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }, [
    isAddItemDialogOpen,
    itemId,
    itemType,
    handleAddItemToFolder,
    translate,
    addItemToFolderMutation.isPending,
  ]);

  const handleAddItemClick = useCallback(() => {
    setItemId('');
    setItemType(RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum.Asset);
    setIsAddItemDialogOpen(true);
  }, []);

  return (
    <React.Fragment>
      <Grid item>
        <Button variant='contained' size='large' onClick={handleAddItemClick}>
          {translate('Action.AddItemToFolder')}
        </Button>
      </Grid>
      {addItemDialog}
    </React.Fragment>
  );
};

export default AddItemToFolderButton;
