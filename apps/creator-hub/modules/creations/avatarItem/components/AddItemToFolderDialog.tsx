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
import { MaxItemsPerFolderAddRequest } from '../constants/avatarItemConstants';
import useAddItemToFolderMutation from '../hooks/useAddItemToFolderMutation';

const ItemIdsInputRows = 3;

const isFolderItemType = (
  value: string,
): value is RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum =>
  value === RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset ||
  value === RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Bundle;

/**
 * Parses a comma/whitespace/newline-separated list of item IDs into a de-duplicated, trimmed list
 * (dropping empty entries). Non-numeric entries are preserved so callers can validate them.
 */
export const parseItemIds = (raw: string): string[] => {
  const ids = raw
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return [...new Set(ids)];
};

const isNumericId = (id: string): boolean => /^\d+$/.test(id);

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
  const [itemIdsInput, setItemIdsInput] = useState<string>('');
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

  const { addItemsToFolder, isAddingItems } = useAddItemToFolderMutation({
    onSuccess: () => {
      showBottomMsg(translate('Message.AddItemsToFolderSuccess'));
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

      const itemIds = parseItemIds(itemIdsInput);
      if (itemIds.length === 0) {
        showBottomMsg(translate('Error.ItemIdEmpty'));
        return;
      }
      if (itemIds.some((id) => !isNumericId(id))) {
        showBottomMsg(translate('Error.ItemIdInvalid'));
        return;
      }
      if (itemIds.length > MaxItemsPerFolderAddRequest) {
        showBottomMsg(
          translate('Error.TooManyItemsToAdd', { max: String(MaxItemsPerFolderAddRequest) }),
        );
        return;
      }

      addItemsToFolder({ itemIds, itemType, folderId: selectedFolderId });
    },
    [itemIdsInput, itemType, selectedFolderId, showBottomMsg, addItemsToFolder, translate],
  );

  return (
    <Dialog open onClose={onClose} fullWidth>
      <DialogTitle>{translate('Label.AddItemsToFolder')}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} id='add-item-form'>
          <Grid container direction='column' spacing={2} className='padding-top-small'>
            <Grid item>
              <TextField
                id='itemIds'
                label={translate('Label.ItemIds')}
                value={itemIdsInput}
                onChange={(e) => setItemIdsInput(e.target.value)}
                fullWidth
                multiline
                minRows={ItemIdsInputRows}
                placeholder={translate('Placeholder.ItemIdsCsv')}
                margin='dense'
                InputLabelProps={{ shrink: true }}
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
          disabled={isAddingItems}
          variant='contained'
          size='large'
          loading={isAddingItems}>
          {translate('Action.AddItemsToFolder')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddItemToFolderDialog;
