import React, { FunctionComponent, useCallback } from 'react';
import { useSnackbar } from '@rbx/ui';
import { Item, toastDurationTime } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { useMutation } from '@tanstack/react-query';
import { itemconfigurationClient } from '@modules/clients';
import { RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequestItemTypeEnum } from '@rbx/client-itemconfiguration/v1';
import CreationData from '../interfaces/CreationData';
import TrackedMenuItem from './TrackedMenuItem';

export interface ItemCardRemoveFromFolderButtonProps {
  creation: CreationData;
  handleClose: () => void;
  removeItem: () => void;
}

const ItemCardRemoveFromFolderButton: FunctionComponent<
  React.PropsWithChildren<ItemCardRemoveFromFolderButtonProps>
> = ({ creation, handleClose, removeItem }) => {
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();

  const mapItemToFolderItemType = useCallback(
    (
      itemType: Item,
    ): RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequestItemTypeEnum => {
      switch (itemType) {
        case Item.CatalogAsset:
          return RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequestItemTypeEnum.Asset;
        case Item.Bundle:
          return RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequestItemTypeEnum.Bundle;
        default:
          return RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequestItemTypeEnum.Unknown;
      }
    },
    [],
  );

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

  const removeFromFolderMutation = useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      containingFolderId,
    }: {
      itemId: string | number;
      itemType: Item;
      containingFolderId: string | number;
    }) => {
      const folderItemType = mapItemToFolderItemType(itemType);
      return itemconfigurationClient.removeItemFromFolder(
        itemId.toString(),
        folderItemType,
        containingFolderId.toString(),
      );
    },
    onSuccess: () => {
      showBottomMsg(translate('Message.ItemRemovedFromFolder'));
      removeItem();
      handleClose();
    },
    onError: () => {
      showBottomMsg(translate('Message.ItemRemovalFromFolderFailed'));
    },
  });

  const handleRemoveFromFolder = useCallback(() => {
    const { assetId, bundleId, containingFolderId, itemType } = creation;
    const itemId = itemType === Item.CatalogAsset ? (assetId ?? 0) : (bundleId ?? 0);

    if (containingFolderId) {
      removeFromFolderMutation.mutate({
        itemId,
        itemType,
        containingFolderId: containingFolderId.toString(),
      });
    }
  }, [creation, removeFromFolderMutation]);

  return (
    <TrackedMenuItem
      onClick={handleRemoveFromFolder}
      disabled={removeFromFolderMutation.isPending}
      itemKey='Action.RemoveItemFromFolder'>
      {translate('Action.RemoveItemFromFolder')}
    </TrackedMenuItem>
  );
};

export default ItemCardRemoveFromFolderButton;
