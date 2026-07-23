import React, { FunctionComponent, useCallback, useState } from 'react';
import { Typography, useSnackbar } from '@rbx/ui';
import { PublishError, toastDurationTime } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { itemconfigurationClient, ItemStatus } from '@modules/clients';
import GenericBEDEV1Error from '@modules/clients/errors/GenericBEDEV1Error';
import publishErrorDescription from '@modules/miscellaneous/common/constants/publishErrorDescription';
import { RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel } from '@rbx/client-itemconfiguration/v1';
import {
  SaleLocationEnum,
  mapSaleLocationToType,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import CreationData from '../interfaces/CreationData';
import TrackedMenuItem from './TrackedMenuItem';

export interface ItemCardToggleSaleButtonProps {
  creation: CreationData;
  updateItem: (item: CreationData) => void;
  handleClose: () => void;
}

const isForSale = (saleStatus: ItemStatus | undefined): boolean => {
  switch (saleStatus) {
    case ItemStatus.OnSale:
    case ItemStatus.Free:
      return true;
    default:
      return false;
  }
};

const ItemCardToggleSaleButton: FunctionComponent<
  React.PropsWithChildren<ItemCardToggleSaleButtonProps>
> = ({ creation, updateItem, handleClose }) => {
  const { status } = creation;
  const assetId = (creation.assetId as number) ?? 0;
  const { translate } = useTranslation();

  const [isTakingOffSale, setIsTakingOffSale] = useState<boolean>(false);
  const { enqueue, close: closeSnackbar } = useSnackbar();

  const showSnackbar = useCallback(
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

  const takeOffSale = useCallback(async () => {
    setIsTakingOffSale(true);
    try {
      const getCollectibleItemIdResponse =
        await itemconfigurationClient.getCollectibleItemId(assetId);
      const collectibleItemIdValue = getCollectibleItemIdResponse?.collectibleItemId;

      if (collectibleItemIdValue) {
        const saleLocationModel: RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel =
          {
            saleLocationType: mapSaleLocationToType(SaleLocationEnum.MarketplaceAndAllExperiences),
            places: [],
          };
        await itemconfigurationClient.updateCollectibleInformation(
          collectibleItemIdValue,
          saleLocationModel,
          false,
          0,
          false,
          1,
          0,
          false,
        );
        showSnackbar(translate('Message.TakeOffSaleSuccess'));
        updateItem({ ...creation, status: ItemStatus.OffSale, price: null });
      } else {
        showSnackbar(translate('Message.TakeOffSaleFailed'));
      }
    } catch (e) {
      if (e instanceof GenericBEDEV1Error && Object.values(PublishError).includes(e.code)) {
        showSnackbar(translate(publishErrorDescription[e.code as PublishError]));
      } else {
        showSnackbar(translate('Message.TakeOffSaleFailed'));
      }
    } finally {
      setIsTakingOffSale(false);
      handleClose();
    }
  }, [assetId, creation, handleClose, showSnackbar, translate, updateItem]);

  return isForSale(status) ? (
    <TrackedMenuItem onClick={takeOffSale} disabled={isTakingOffSale} itemKey='Action.TakeOffSale'>
      <Typography>{translate('Action.TakeOffSale')}</Typography>
    </TrackedMenuItem>
  ) : null;
};

export default ItemCardToggleSaleButton;
