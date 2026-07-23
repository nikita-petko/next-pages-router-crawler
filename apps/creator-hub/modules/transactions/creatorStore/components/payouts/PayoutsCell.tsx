import React, { FunctionComponent, useMemo } from 'react';
import { Grid, TableCell } from '@rbx/ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { formatDate } from '@modules/miscellaneous/common/utils';
import { getPriceDisplayStringFromMoney } from '@modules/marketplaceFiatService/utils/fiatUtils';
import { RobloxMarketplaceFiatSharedV1Beta1Payout as Payout } from '@rbx/clients/marketplaceFiatService';
import { ColumnType } from '../../constants/TableInfo';
import IconItem, { IconItemType } from '../IconItem';
import PayoutStatus from './PayoutStatus';

export type PayoutsCellProps = {
  columnType: ColumnType;
  rowData?: Payout;
};

const robloxUserId = 1;
const robloxUsername = 'Roblox';

const PayoutsCell: FunctionComponent<React.PropsWithChildren<PayoutsCellProps>> = ({
  columnType,
  rowData,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();

  const isFreePrice = useMemo(() => {
    if (rowData && rowData.amount && rowData.amount.quantity !== undefined) {
      return rowData.amount?.quantity?.significand === 0;
    }
    return true;
  }, [rowData]);

  const content: React.JSX.Element | string | null = useMemo(() => {
    switch (columnType) {
      case ColumnType.Amount:
        return (
          <Grid container spacing={1}>
            {rowData?.status && <PayoutStatus status={rowData.status} />}
            <Grid item>
              {isFreePrice || !rowData?.amount
                ? translate('Label.Free')
                : getPriceDisplayStringFromMoney(rowData.amount, locale ?? Locale.English)}
            </Grid>
          </Grid>
        );

      case ColumnType.Date:
        return rowData?.payoutDateTime
          ? formatDate(rowData.payoutDateTime, locale ?? Locale.English)
          : translate('Label.UnknownDate');

      case ColumnType.Source:
        // NOTE: Payouts will always have a source of Roblox. This was an intentional deisgn choice.
        return (
          <IconItem targetId={robloxUserId} text={robloxUsername} type={IconItemType.Creator} />
        );

      default:
        // eslint-disable-next-line no-console -- fallback error logging for unknown column types
        console.error(`No ColumnType was found for ${columnType}`);
        return null;
    }
  }, [columnType, isFreePrice, locale, rowData, translate]);

  return <TableCell data-testid={content ? 'transaction-cell-id' : ''}>{content}</TableCell>;
};

export default PayoutsCell;
