import { useEffect, useMemo, useState } from 'react';
import { Grid, TableCell, Link, Typography } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { formatDate } from '@modules/miscellaneous/common/utils';
import useThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/useThumbnailImage';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import {
  RobloxPaidAccessFiatPaidAccessServiceV1PurchaseStatus as PurchaseStatus,
  RobloxPaidAccessFiatPaidAccessServiceV1PurchaseDetails as PurchaseDetails,
} from '@rbx/clients/fiatPaidAccessService';
import useFormatters from '../../hooks/useFormatters';
import PurchaseChargeStatus from './PurchaseChargeStatus';
import { ColumnType, PurchaseStatusMap } from '../../constants/TableInfo';
import getUsernameFromUserId from '../../utils/paidAccessUtils';

import usePurchaseCellStyles from './PurchaseCell.styles';
import { getPlaceUrl, getUserUrl } from '../../constants/UrlConstants';
import { PaidAccessProduct } from '../../constants/PaidAccessProductType';

interface PurchaseCellProps {
  columnType: ColumnType;
  rowData?: PurchaseDetails;
  product: PaidAccessProduct;
  universeId: number;
}

function PurchaseCell({ columnType, rowData, product, universeId }: PurchaseCellProps) {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { formatPrice } = useFormatters();
  const { classes: styles } = usePurchaseCellStyles();

  const [username, setUsername] = useState<string>('');

  const { thumbnailImage } = useThumbnailImage({
    alt: username,
    returnPolicy: ReturnPolicy.PlaceHolder,
    targetId: rowData?.purchaserId ?? 0,
    targetType: ThumbnailTypes.avatarHeadshot,
  });

  useEffect(() => {
    async function getUsername() {
      const usernameRes = await getUsernameFromUserId(rowData?.purchaserId ?? 0);
      setUsername(usernameRes);
    }
    getUsername();
  });

  const content: React.JSX.Element | string | null = useMemo(() => {
    switch (columnType) {
      case ColumnType.Date:
        return rowData?.createdTime
          ? formatDate(rowData.createdTime, locale ?? Locale.English)
          : translate('Label.UnknownDate');

      case ColumnType.Purchaser: {
        const url = getUserUrl(rowData?.purchaserId ?? 0);
        return (
          <Grid container alignItems='center' columnGap={2}>
            <Grid item className={styles.avatarIcon}>
              {thumbnailImage}
            </Grid>
            <Grid item>
              <Grid container direction='column' justifyContent='space-between'>
                <Grid item>
                  <Link color='inherit' href={url} underline='none'>
                    <Typography variant='body2'>{username}</Typography>
                  </Link>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );
      }

      case ColumnType.AssetDescription: {
        const url = getPlaceUrl(universeId);
        return (
          <Grid container alignItems='center' columnGap={2}>
            <Grid item className={styles.placeIcon}>
              {product.thumbnail}
            </Grid>
            <Grid item>
              <Grid container direction='column' justifyContent='space-between'>
                <Grid item>
                  <Link color='inherit' href={url} underline='none'>
                    <Typography variant='body2'>{product.productName}</Typography>
                  </Link>
                </Grid>
                <Grid item>
                  <Typography variant='body2'>
                    {translate('Label.AssetId', {
                      assetId: rowData?.rootPlaceId ? rowData?.rootPlaceId.toString() : '',
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        );
      }

      case ColumnType.TransactionType:
        return translate('Label.Sale');

      case ColumnType.PriceSold:
        return rowData?.priceSold ? formatPrice(rowData?.priceSold.amount) : null;

      case ColumnType.Status:
        return (
          <Grid container spacing={1} justifyContent='flex-end'>
            {rowData?.status && (
              <PurchaseChargeStatus
                status={PurchaseStatusMap.get(rowData?.status) ?? PurchaseStatus.Invalid}
              />
            )}
          </Grid>
        );

      case ColumnType.NetAmount: {
        const isSuccess =
          PurchaseStatusMap.get(rowData?.status ?? '') === PurchaseStatus.PurchaseSuccess;
        const netAmount =
          isSuccess && rowData?.netAmount
            ? rowData?.netAmount
            : {
                currencyCode: rowData?.netAmount?.currencyCode,
                units: 0,
                nanos: 0,
              };
        return (
          <Grid container spacing={1}>
            <Grid item>{formatPrice(netAmount)}</Grid>
          </Grid>
        );
      }

      default:
        return null;
    }
  }, [
    columnType,
    formatPrice,
    locale,
    product.productName,
    product.thumbnail,
    rowData?.createdTime,
    rowData?.netAmount,
    rowData?.priceSold,
    rowData?.purchaserId,
    rowData?.rootPlaceId,
    rowData?.status,
    styles.avatarIcon,
    styles.placeIcon,
    thumbnailImage,
    translate,
    universeId,
    username,
  ]);

  return <TableCell data-testid={content ? 'transaction-cell-id' : ''}>{content}</TableCell>;
}

export default PurchaseCell;
