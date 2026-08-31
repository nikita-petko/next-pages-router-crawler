import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import type { RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel } from '@rbx/client-itemconfiguration/v1';
import { useTranslation } from '@rbx/intl';
import { Typography, useSnackbar } from '@rbx/ui';
import GenericBEDEV1Error from '@modules/clients/errors/GenericBEDEV1Error';
import itemconfigurationClient, { ItemStatus } from '@modules/clients/itemconfiguration';
import { PublishError, toastDurationTime } from '@modules/miscellaneous/common';
import publishErrorDescription from '@modules/miscellaneous/common/constants/publishErrorDescription';
import {
  SaleLocationEnum,
  mapSaleLocationToType,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import type CreationData from '../interfaces/CreationData';
import TrackedMenuItem from './TrackedMenuItem';

export interface ItemCardToggleSaleButtonProps {
  creation: CreationData;
  updateItem: (item: CreationData) => void;
  handleClose: () => void;
}

const isForSale = (saleStatus: ItemStatus | undefined): boolean =>
  saleStatus === ItemStatus.OnSale || saleStatus === ItemStatus.Free;

const ItemCardToggleSaleButton: FunctionComponent<
  React.PropsWithChildren<ItemCardToggleSaleButtonProps>
> = ({ creation, updateItem, handleClose }) => {
  const { status, collectibleItemId } = creation;
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
      if (collectibleItemId) {
        const saleLocationModel: RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel =
          {
            saleLocationType: mapSaleLocationToType(SaleLocationEnum.MarketplaceAndAllExperiences),
            places: [],
          };
        await itemconfigurationClient.updateCollectibleInformation(
          collectibleItemId,
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
        // oxlint-disable-next-line typescript/no-unnecessary-type-assertion -- publishErrorDescription is keyed by PublishError; numeric enum lookup needs explicit narrowing
        showSnackbar(translate(publishErrorDescription[e.code as PublishError]));
      } else {
        showSnackbar(translate('Message.TakeOffSaleFailed'));
      }
    } finally {
      setIsTakingOffSale(false);
      handleClose();
    }
  }, [collectibleItemId, creation, handleClose, showSnackbar, translate, updateItem]);

  return isForSale(status) ? (
    <TrackedMenuItem onClick={takeOffSale} disabled={isTakingOffSale} itemKey='Action.TakeOffSale'>
      <Typography>{translate('Action.TakeOffSale')}</Typography>
    </TrackedMenuItem>
  ) : null;
};

export default ItemCardToggleSaleButton;
