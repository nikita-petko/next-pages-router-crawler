import React from 'react';
import { RobuxIcon, Typography, TTypographyProps } from '@rbx/ui';
import { Locale } from '@rbx/intl';
import { CellDataType, ColumnType } from '@modules/charts-generic';
import { CreatorType } from '@modules/miscellaneous/common';
import { Flex, ThumbnailWithNames } from '@modules/miscellaneous/common/components';
import { User } from '@modules/clients';

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
}

const createPayoutReviewTableRow = ({
  user,
  amount,
  locale,
  labelText,
  amountVariant = 'body1',
  labelVariant = 'body1',
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
          <Flex alignItems='center' gap={8}>
            <RobuxIcon fontSize='medium' />
            <Typography variant={amountVariant}>
              {Intl.NumberFormat(locale).format(amount)}
            </Typography>
          </Flex>
        ),
      },
    ],
  ]);
};

export default createPayoutReviewTableRow;
