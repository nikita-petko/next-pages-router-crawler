import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import { useSnackbar } from '@rbx/ui';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import { Item, toastDurationTime } from '@modules/miscellaneous/common';
import type CreationData from '../interfaces/CreationData';
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
    (itemType: Item): RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum => {
      if (itemType === Item.CatalogAsset) {
        return RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Asset;
      }
      if (itemType === Item.Bundle) {
        return RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Bundle;
      }
      return RobloxItemConfigurationApiModelsFolderFolderItemItemTypeEnum.Unknown;
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

  const { mutate: removeFromFolder, isPending } = useMutation({
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
      removeFromFolder({
        itemId,
        itemType,
        containingFolderId,
      });
    }
  }, [creation, removeFromFolder]);

  return (
    <TrackedMenuItem
      onClick={handleRemoveFromFolder}
      disabled={isPending}
      itemKey='Action.RemoveItemFromFolder'>
      {translate('Action.RemoveItemFromFolder')}
    </TrackedMenuItem>
  );
};

export default ItemCardRemoveFromFolderButton;
