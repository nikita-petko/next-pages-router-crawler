import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  SearchIcon,
  TextField,
  Typography,
  useSnackbar,
} from '@rbx/ui';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { Item, toastDurationTime } from '@modules/miscellaneous/common';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import {
  getFoldersQueryKey,
  useAddItemToFolderMutation,
  useGetFolders,
} from '@modules/react-query/itemConfiguration/itemConfigurationQueries';
import type CreationData from '../../common/interfaces/CreationData';
import CreateFolderDialog from './CreateFolderDialog';

// itemconfiguration error codes surfaced by the add-item-to-folder endpoint.
const ErrorCode = {
  ItemIdInvalid: 3,
  ItemNotFound: 6,
  ItemNotOwned: 9,
} as const;

export interface AddItemToFolderModalProps {
  open: boolean;
  onClose: () => void;
  creation: CreationData;
  groupId?: number;
}

const mapItemToFolderItemType = (
  itemType: Item,
): RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum => {
  if (itemType === Item.CatalogAsset) {
    return RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset;
  }
  if (itemType === Item.Bundle) {
    return RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Bundle;
  }
  return RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Unknown;
};

const AddItemToFolderModal: FunctionComponent<
  React.PropsWithChildren<AddItemToFolderModalProps>
> = ({ open, onClose, creation, groupId }) => {
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);

  // Only fetch the folder list while the picker is open.
  const { data, isLoading, isError } = useGetFolders(itemconfigurationClient, groupId, open);

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

  const handleClose = useCallback(() => {
    setSearch('');
    setSelectedFolderId('');
    setIsNewFolderOpen(false);
    onClose();
  }, [onClose]);

  const { mutate: addItemToFolder, isPending } = useAddItemToFolderMutation(
    itemconfigurationClient,
    {
      onSuccess: () => {
        showBottomMsg(translate('Message.AddItemToFolderSuccess'));
        handleClose();
      },
      onError: async (error) => {
        const errorResponse = await tryParseResponseError(error);
        switch (errorResponse?.code ?? -1) {
          case ErrorCode.ItemIdInvalid:
            showBottomMsg(translate('Error.ItemIdInvalid'));
            break;
          case ErrorCode.ItemNotOwned:
            showBottomMsg(translate('Error.ItemNotOwned'));
            break;
          case ErrorCode.ItemNotFound:
            showBottomMsg(translate('Message.ItemNotFound'));
            break;
          default:
            showBottomMsg(translate('Error.AddItemToFolderFailure'));
            break;
        }
      },
    },
  );

  const handleAddItem = useCallback(() => {
    const itemType = mapItemToFolderItemType(creation.itemType);
    const rawId = creation.itemType === Item.CatalogAsset ? creation.assetId : creation.bundleId;
    addItemToFolder({ itemId: String(rawId ?? ''), itemType, folderId: selectedFolderId });
  }, [addItemToFolder, creation, selectedFolderId]);

  // After a folder is created in the sub-dialog, refresh the list and preselect the new folder.
  const handleFolderCreated = useCallback(
    (folderId: string) => {
      setIsNewFolderOpen(false);
      setSearch('');
      void queryClient.invalidateQueries({ queryKey: getFoldersQueryKey(groupId) });
      if (folderId) {
        setSelectedFolderId(folderId);
      }
    },
    [queryClient, groupId],
  );

  const folders = useMemo(() => {
    return (data?.folders ?? []).filter(
      (folder): folder is { folderId: string; name: string } => !!folder.folderId && !!folder.name,
    );
  }, [data]);

  const filteredFolders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return folders;
    }
    return folders.filter((folder) => folder.name.toLowerCase().includes(query));
  }, [folders, search]);

  const content = useMemo(() => {
    if (isLoading) {
      return <CircularProgress aria-label={translate('Placeholder.SearchFolders')} />;
    }
    if (isError) {
      return <Typography>{translate('Error.LoadFoldersFailure')}</Typography>;
    }
    if (folders.length === 0) {
      // Reuse the same illustration the rest of the avatar-items section uses for its empty states.
      return (
        <EmptyState
          size='small'
          illustration='avatarItem'
          title={translate('Heading.NoFolders')}
          description={translate('Label.NoFoldersDescription')}
        />
      );
    }
    return (
      <>
        <TextField
          id='folderSearch'
          label=''
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          // Stop keystrokes from bubbling to the parent context menu's type-ahead handler (which
          // steals focus when a letter matches a menu item), but let Escape through so it can still
          // close the dialog.
          onKeyDown={(e) => {
            if (e.key !== 'Escape') {
              e.stopPropagation();
            }
          }}
          fullWidth
          margin='dense'
          InputProps={{
            startAdornment: <SearchIcon />,
            placeholder: translate('Placeholder.SearchFolders'),
          }}
        />
        <div
          className={
            filteredFolders.length === 0
              ? 'flex [flex:1] [min-height:0] items-center justify-center [overflow-y:auto]'
              : '[flex:1] [min-height:0] [overflow-y:auto]'
          }>
          {filteredFolders.length === 0 ? (
            <Typography>{translate('Label.NoMatchingFolders')}</Typography>
          ) : (
            <List>
              {filteredFolders.map((folder, index) => {
                const isSelected = folder.folderId === selectedFolderId;
                return (
                  <React.Fragment key={folder.folderId}>
                    {index > 0 && <Divider component='li' />}
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => setSelectedFolderId(folder.folderId)}>
                      <ListItemText primary={folder.name} />
                      {isSelected && <Icon name='icon-regular-check' size='Small' aria-hidden />}
                    </ListItemButton>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </div>
      </>
    );
  }, [isLoading, isError, folders, filteredFolders, search, selectedFolderId, translate]);

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth='Medium' fullWidth>
        <DialogTitle>{translate('Label.AddItemToFolder')}</DialogTitle>
        <DialogContent
          data-testid='add-item-folder-content'
          className='flex [flex-direction:column] [height:400px]'>
          {content}
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            size='large'
            onClick={() => setIsNewFolderOpen(true)}
            className='[margin-right:auto]'>
            {translate('Action.NewFolder')}
          </Button>
          <Button variant='outlined' color='secondary' size='large' onClick={handleClose}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            variant='contained'
            size='large'
            disabled={!selectedFolderId || isPending}
            loading={isPending}
            onClick={handleAddItem}>
            {translate('Action.AddItemToFolder')}
          </Button>
        </DialogActions>
      </Dialog>
      {isNewFolderOpen && (
        <CreateFolderDialog
          open
          onClose={() => setIsNewFolderOpen(false)}
          onFolderCreated={handleFolderCreated}
          groupId={groupId}
        />
      )}
    </>
  );
};

export default AddItemToFolderModal;
