import { numberFormatter } from '@rbx/core';
import type { Locale } from '@rbx/intl';
import type { TTypographyProps } from '@rbx/ui';
import { RobuxIcon, Typography } from '@rbx/ui';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import type { User } from '@modules/clients/users';
import { CreatorType } from '@modules/miscellaneous/common';
import ThumbnailWithNames from '@modules/miscellaneous/components/ThumbnailWithNames';

export enum PayoutReviewTableColumnKey {
  Member = 'member',
  Amount = 'amount',
}

interface OneTimePayoutReviewTableRowProps {
  user?: User;
  amount: number;
  locale: Locale;
  labelText?: string;
  amountVariant?: TTypographyProps['variant'];
  labelVariant?: TTypographyProps['variant'];
  fiatEstimateUsd?: number;
}

const createPayoutReviewTableRow = ({
  user,
  amount,
  locale,
  labelText,
  amountVariant = 'body1',
  labelVariant = 'body1',
  fiatEstimateUsd,
}: OneTimePayoutReviewTableRowProps): Map<PayoutReviewTableColumnKey, CellDataType> => {
  return new Map<PayoutReviewTableColumnKey, CellDataType>([
    [
      PayoutReviewTableColumnKey.Member,
      {
        type: ColumnType.Other,
        value: user ? (
          <ThumbnailWithNames target={user} targetType={CreatorType.User} textVariant='secondary' />
        ) : (
          <Typography variant={labelVariant}>{labelText}</Typography>
        ),
      },
    ],
    [
      PayoutReviewTableColumnKey.Amount,
      {
        type: ColumnType.Other,
        value: (
          <div className='flex flex-col gap-xxsmall'>
            <div className='flex items-center gap-xsmall'>
              <RobuxIcon fontSize='medium' />
              <Typography variant={amountVariant}>
                {Intl.NumberFormat(locale).format(amount)}
              </Typography>
            </div>
            {fiatEstimateUsd != null && fiatEstimateUsd > 0 && (
              <Typography
                variant='caption'
                className='font-semibold padding-left-xlarge text-align-x-left'>
                {String(numberFormatter(fiatEstimateUsd, 'currency'))}
              </Typography>
            )}
          </div>
        ),
      },
    ],
  ]);
};

export default createPayoutReviewTableRow;
