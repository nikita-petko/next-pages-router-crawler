/* istanbul ignore file */

import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
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
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';

interface AddItemToFolderParams {
  itemId: string;
  itemType: RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum;
  folderId: string;
}

const isFolderItemType = (
  value: string,
): value is RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum =>
  value === RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset ||
  value === RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Bundle;

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
    useState<RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum>(
      RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset,
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

  const { mutate: addItemToFolder, isPending } = useMutation({
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
      setItemType(RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset);
      setIsAddItemDialogOpen(false);
      onFolderContentsUpdated();
    },
    onError: async (error) => {
      const errorResponse = await tryParseResponseError(error);
      switch (errorResponse?.code ?? -1) {
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
    (event?: React.SyntheticEvent<HTMLFormElement>) => {
      if (event) {
        event.preventDefault();
      }

      if (!itemId.trim()) {
        showBottomMsg(translate('Error.ItemIdEmpty'));
        return;
      }

      addItemToFolder({
        itemId: itemId.trim(),
        itemType,
        folderId: selectedFolderId,
      });
    },
    [itemId, itemType, selectedFolderId, showBottomMsg, addItemToFolder, translate],
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
            disabled={isPending}
            variant='contained'
            size='large'
            loading={isPending}>
            {translate('Action.AddItemToFolder')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }, [isAddItemDialogOpen, itemId, itemType, handleAddItemToFolder, translate, isPending]);

  const handleAddItemClick = useCallback(() => {
    setItemId('');
    setItemType(RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset);
    setIsAddItemDialogOpen(true);
  }, []);

  return (
    <>
      <Grid item>
        <Button variant='contained' size='large' onClick={handleAddItemClick}>
          {translate('Action.AddItemToFolder')}
        </Button>
      </Grid>
      {addItemDialog}
    </>
  );
};

export default AddItemToFolderButton;
