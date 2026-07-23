import {
  itemconfigurationClient,
  marketplaceItemsClient,
  tryParseResponseError,
} from '@modules/clients';
import { useTranslation } from '@rbx/intl';
import { DialogTemplate, useDialog, useSnackbar } from '@rbx/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Item } from '@modules/miscellaneous/common';
import CreationData from '../interfaces/CreationData';
import TrackedMenuItem from './TrackedMenuItem';

interface ItemCardDelistButtonProps {
  creation: CreationData;
  handleClose: () => void;
  removeItem: () => void;
  itemType: Item;
}

function ItemCardDelistButton({
  creation,
  handleClose,
  removeItem,
  itemType,
}: ItemCardDelistButtonProps) {
  const [isDelistUpdating, setIsDelistUpdating] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();
  const { translate } = useTranslation();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const router = useRouter();

  // Items which are part of a look cannot be archived from the look page
  const isOnLookPage = useMemo(() => {
    return router.pathname?.includes('/look/') ?? false;
  }, [router.pathname]);

  const showBottomMsg = useCallback(
    (msg: string) => {
      enqueue({
        message: msg,
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const handleArchiveItemInMarketplace = useCallback(async () => {
    try {
      setIsDelistUpdating(true);
      const idToDelist = +(itemType === Item.CatalogAsset
        ? (creation.assetId ?? 0)
        : (creation.bundleId ?? 0));

      // Perform checks specific to assets
      if (itemType === Item.CatalogAsset) {
        const getCollectibleItemIdResponse =
          await itemconfigurationClient.getCollectibleItemId(idToDelist);
        const collectibleItemIdValue = getCollectibleItemIdResponse?.collectibleItemId;
        if (collectibleItemIdValue) {
          const getCollectibleDetailsResponse =
            await marketplaceItemsClient.getCollectibleItemsDetails([collectibleItemIdValue]);
          const collectibleDetails = getCollectibleDetailsResponse?.[0];
          if (collectibleDetails?.itemType === 1) {
            showBottomMsg(translate('Message.UnableToArchiveLimitedItem'));
            closeDialog();
            return;
          }
        }
      }

      await itemconfigurationClient.delistItem(itemType === Item.Bundle, idToDelist);
      removeItem();
      showBottomMsg(translate('Message.ItemArchived'));
      closeDialog();
    } catch (error) {
      const errorResponse = await tryParseResponseError(error);
      switch (errorResponse?.code) {
        case 3:
          showBottomMsg(translate('Message.ItemTooNew'));
          break;
        default:
          showBottomMsg(translate('Message.ArchiveFailed'));
          break;
      }
    } finally {
      setIsDelistUpdating(false);
      closeDialog();
      handleClose();
    }
  }, [
    itemType,
    creation.assetId,
    creation.bundleId,
    removeItem,
    showBottomMsg,
    translate,
    closeDialog,
    handleClose,
  ]);

  const confirmArchiveDialog = useMemo(() => {
    return (
      <DialogTemplate
        onConfirm={handleArchiveItemInMarketplace}
        onCancel={closeDialog}
        title={translate('Label.ConfirmArchive')}
        content={translate('Description.MarketplaceArchive')}
        confirmText={translate('Action.Archive')}
        cancelText={translate('Action.Cancel')}
      />
    );
  }, [handleArchiveItemInMarketplace, translate, closeDialog]);

  const handleDialogOpen = useCallback(() => {
    configure(confirmArchiveDialog);
    open();
  }, [confirmArchiveDialog, configure, open]);

  useEffect(() => {
    if (isDelistUpdating) {
      configure(confirmArchiveDialog);
    }
  }, [isDelistUpdating, confirmArchiveDialog, configure]);

  return (
    !creation.isDelisted &&
    !isOnLookPage && (
      <div>
        <TrackedMenuItem
          onClick={handleDialogOpen}
          disabled={isDelistUpdating}
          itemKey='Action.ArchiveInMarketplace'>
          {translate('Action.ArchiveInMarketplace')}
        </TrackedMenuItem>
      </div>
    )
  );
}

export default ItemCardDelistButton;
