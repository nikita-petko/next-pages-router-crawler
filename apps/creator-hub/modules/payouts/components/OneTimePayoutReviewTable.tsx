import React, { FunctionComponent, useMemo } from 'react';
import {
  TableColumnConfig,
  GenericTableV2,
  CellDataType,
  ColumnType,
  useLocalPaginatedAdapter,
} from '@modules/charts-generic';
import { Locale, useLocalization } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import { PayoutReviewTablePageSize } from '../constants/payoutsConstants';
import { calculatePayoutsTotal } from '../utils/payoutsUtils';
import createPayoutReviewTableRow, {
  PayoutReviewTableColumnKey,
} from '../utils/createPayoutReviewTableRow';

export interface OneTimePayoutReviewTableProps {
  payouts: OneTimePayoutBase[];
}

const columnConfigs: TableColumnConfig<PayoutReviewTableColumnKey>[] = [
  {
    columnKey: PayoutReviewTableColumnKey.Member,
    columnType: ColumnType.Other,
    titleKey: { key: 'Label.Member', namespace: TranslationNamespace.Payouts },
  },
  {
    columnKey: PayoutReviewTableColumnKey.Amount,
    columnType: ColumnType.Other,
    titleKey: { key: 'Label.Amount', namespace: TranslationNamespace.Payouts },
  },
];

const OneTimePayoutReviewTable: FunctionComponent<OneTimePayoutReviewTableProps> = ({
  payouts,
}) => {
  const { locale } = useLocalization();
  const {
    paginatedData,
    page,
    pageSize,
    total,
    onNextPage,
    onPreviousPage,
    setPageSize,
    hasNext,
    hasPrevious,
  } = useLocalPaginatedAdapter(payouts, PayoutReviewTablePageSize);

  const rowData: Map<PayoutReviewTableColumnKey, CellDataType>[] = useMemo(() => {
    const payoutRows: Map<PayoutReviewTableColumnKey, CellDataType>[] = paginatedData.map(
      (payout) => {
        const amount = Number.parseInt(payout.amount, 10);
        return createPayoutReviewTableRow({
          user: payout.user,
          amount,
          locale: locale ?? Locale.English,
        });
      },
    );

    // Add total row
    const totalPayoutAmount = calculatePayoutsTotal(payouts);
    payoutRows.push(
      createPayoutReviewTableRow({
        amount: totalPayoutAmount,
        locale: locale ?? Locale.English,
        labelText: 'Total',
        amountVariant: 'h6',
        labelVariant: 'h6',
      }),
    );

    return payoutRows;
  }, [paginatedData, payouts, locale]);

  return (
    <GenericTableV2
      getRowKey={(_, index) => {
        if (index === paginatedData.length) {
          return 'total-row';
        }
        return paginatedData[index].user.id.toString();
      }}
      columnConfigs={columnConfigs}
      rowData={rowData}
      isDataLoading={false}
      isResponseFailed={false}
      isUserForbidden={false}
      pagination={
        total > pageSize
          ? {
              page,
              total,
              pageSize,
              pageSizeOptions: [],
              setPageSize,
              onNextPage,
              onPreviousPage,
              hasNext,
              hasPrevious,
            }
          : null
      }
    />
  );
};

export default OneTimePayoutReviewTable;
