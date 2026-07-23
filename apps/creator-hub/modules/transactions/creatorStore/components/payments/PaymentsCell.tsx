import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Grid, TableCell } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { formatDate } from '@modules/miscellaneous/common/utils';
import {
  RobloxMarketplaceFiatSharedV1Beta1PurchaserPayment as PurchaserPayment,
  RobloxMarketplaceFiatSharedV1Beta1SellerPayment as SellerPayemnt,
  RobloxGlobalEntitiesV1EntityType as EntityType,
} from '@rbx/clients/marketplaceFiatService';
import { Money } from '@modules/clients/creatorStoreProduct/openCloudCreatorStoreProduct';
import { getPriceDisplayStringFromMoney } from '@modules/marketplaceFiatService/utils/fiatUtils';
import { ColumnType } from '../../constants/TableInfo';
import { ProductTypeToAssetType } from '../../constants/ProductTypeToAssetType';
import IconItem, { IconItemType } from '../IconItem';
import PurchaseChargeStatus from './PurchaseChargeStatus';

export type PaymentsCellProps = {
  columnType: ColumnType;
  rowData?: PurchaserPayment | SellerPayemnt;
};

const PaymentsCell: FunctionComponent<React.PropsWithChildren<PaymentsCellProps>> = ({
  columnType,
  rowData,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();

  const basePayment = rowData?.basePayment ?? null;
  const totalAmount = basePayment?.totalAmount;
  const date = basePayment?.paymentDateTime;

  const isFreePrice = useCallback((price: Money) => {
    if (price?.quantity?.significand !== undefined) {
      return price?.quantity?.significand === 0;
    }
    return true;
  }, []);

  const content: React.JSX.Element | string | null | undefined = useMemo(() => {
    if (columnType === ColumnType.Amount) {
      const amountText = totalAmount
        ? getPriceDisplayStringFromMoney(totalAmount, locale ?? Locale.English)
        : '';
      return (
        <Grid container spacing={1}>
          <Grid item>
            {totalAmount && isFreePrice(totalAmount) ? translate('Label.Free') : amountText}
          </Grid>
        </Grid>
      );
    }
    if (columnType === ColumnType.AssetDescription) {
      const assetId = basePayment?.productKey?.productTargetId;
      const assetName = basePayment?.productName;
      return (
        <IconItem
          subText={translate('Label.AssetId', {
            assetId: assetId ? assetId.toString() : '',
          })}
          targetId={assetId ? parseInt(assetId, 10) : -1}
          text={assetName ?? ''}
          type={IconItemType.Asset}
        />
      );
    }
    if (columnType === ColumnType.Date) {
      return date ? formatDate(date, locale ?? Locale.English) : translate('Label.UnknownDate');
    }
    if (columnType === ColumnType.Status) {
      return (
        <Grid container spacing={1} justifyContent='flex-end'>
          {basePayment?.purchaseChargeStatus && (
            <PurchaseChargeStatus status={basePayment.purchaseChargeStatus} />
          )}
        </Grid>
      );
    }
    if (columnType === ColumnType.NetAmount) {
      // NOTE: "netAmount" is only available for SellerPayments, so we need to check if it exists before using it
      const netAmount =
        rowData && 'netAmount' in rowData && rowData?.netAmount ? rowData?.netAmount : null;
      return (
        <Grid container spacing={1}>
          <Grid item>
            {netAmount && getPriceDisplayStringFromMoney(netAmount, locale ?? Locale.English)}
          </Grid>
        </Grid>
      );
    }
    if (columnType === ColumnType.PriceSold) {
      return totalAmount
        ? getPriceDisplayStringFromMoney(totalAmount, locale ?? Locale.English)
        : null;
    }
    if (columnType === ColumnType.Purchaser) {
      // NOTE: "purchaser" is only available for SellerPayments, so we need to check if it exists before using it
      const purchaser = rowData && `purchaser` in rowData && rowData?.purchaser?.entity;
      const purchaserId = purchaser && purchaser.longValue;
      const purchaserType = purchaser && purchaser.type;
      const purchaserName = rowData && `purchaserName` in rowData && rowData?.purchaserName;
      return (
        <IconItem
          targetId={purchaserId || -1}
          text={purchaserName || purchaserId?.toString() || ''}
          type={purchaserType === EntityType.User ? IconItemType.Creator : IconItemType.Group}
        />
      );
    }
    if (columnType === ColumnType.Seller) {
      // NOTE: "seller" is only available for PurchaserPayment, so we need to check if it exists before using it
      const seller = rowData && `seller` in rowData && rowData?.seller?.entity;
      const sellerId = seller && seller.longValue;
      const sellerType = seller && seller.type;
      const sellerName = rowData && `sellerName` in rowData && rowData?.sellerName;
      return (
        <IconItem
          targetId={sellerId || -1}
          text={sellerName || sellerId?.toString() || ''}
          type={sellerType === EntityType.User ? IconItemType.Creator : IconItemType.Group}
        />
      );
    }
    if (columnType === ColumnType.TransactionType) {
      const productType = basePayment?.productKey?.productType;
      return productType ? ProductTypeToAssetType.get(productType) : null;
    }

    // eslint-disable-next-line no-console -- This is a catch-all for any ColumnType that is not handled
    console.error(`No ColumnType was found for ${columnType}`);
    return null;
  }, [
    columnType,
    rowData,
    basePayment?.purchaseChargeStatus,
    basePayment?.productKey?.productTargetId,
    basePayment?.productKey?.productType,
    basePayment?.productName,
    isFreePrice,
    totalAmount,
    translate,
    locale,
    date,
  ]);

  return <TableCell data-testid={content ? 'transaction-cell-id' : ''}>{content}</TableCell>;
};

export default PaymentsCell;
