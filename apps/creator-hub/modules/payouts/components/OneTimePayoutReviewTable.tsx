import type { FunctionComponent } from 'react';
import { useMemo, useState } from 'react';
import { numberFormatter } from '@rbx/core';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Typography, RobuxIcon, IconButton, ExpandMoreIcon, ExpandLessIcon } from '@rbx/ui';
import GenericTableV2 from '@modules/charts-generic/tables/GenericTableV2';
import useLocalPaginatedAdapter from '@modules/charts-generic/tables/hooks/useLocalPaginatedAdapter';
import type { TableColumnConfig } from '@modules/charts-generic/tables/types/GenericColumnType';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { CellDataType } from '@modules/charts-generic/tables/types/GenericTableType';
import type { NormalizedEstimatedFiat } from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PayoutReviewTablePageSize } from '../constants/payoutsConstants';
import type { OneTimePayoutBaseV2 as OneTimePayoutBase } from '../interface/OneTimePayoutFormType';
import createPayoutReviewTableRow, {
  PayoutReviewTableColumnKey,
} from '../utils/createPayoutReviewTableRow';
import {
  computePerRecipientAllocations,
  allocatePayoutWatermarkBuckets,
} from '../utils/groupWatermarkUtils';
import { calculatePayoutsTotal } from '../utils/payoutsUtils';
import PayoutAllocationBreakdown from './PayoutAllocationBreakdown';

export interface OneTimePayoutReviewTableProps {
  payouts: OneTimePayoutBase[];
  normalizedWatermarks?: NormalizedEstimatedFiat;
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

const tableClasses = { tableContainer: '[&_tr:last-child>td]:[vertical-align:top]' };

const OneTimePayoutReviewTable: FunctionComponent<OneTimePayoutReviewTableProps> = ({
  payouts,
  normalizedWatermarks,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const [isTotalExpanded, setIsTotalExpanded] = useState(false);
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

  const { perRecipientAllocations, totalAllocation } = useMemo(() => {
    if (!normalizedWatermarks || payouts.length === 0) {
      return { perRecipientAllocations: undefined, totalAllocation: undefined };
    }
    const amounts = payouts.map((p) => Number.parseInt(p.amount, 10) || 0);
    const allocs = computePerRecipientAllocations(amounts, normalizedWatermarks);
    const totalAmount = calculatePayoutsTotal(payouts);
    const totalAlloc =
      totalAmount > 0
        ? allocatePayoutWatermarkBuckets(totalAmount, normalizedWatermarks)
        : undefined;
    return { perRecipientAllocations: allocs, totalAllocation: totalAlloc };
  }, [payouts, normalizedWatermarks]);

  const rowData: Map<PayoutReviewTableColumnKey, CellDataType>[] = useMemo(() => {
    const payoutRows: Map<PayoutReviewTableColumnKey, CellDataType>[] = paginatedData.map(
      (payout, index) => {
        const amount = Number.parseInt(payout.amount, 10);
        const globalIndex = page * pageSize + index;
        return createPayoutReviewTableRow({
          user: payout.user,
          amount,
          locale: locale ?? Locale.English,
          fiatEstimateUsd: perRecipientAllocations?.[globalIndex]?.totalUsd,
        });
      },
    );

    const totalPayoutAmount = calculatePayoutsTotal(payouts);
    const totalFiatUsd = totalAllocation?.totalUsd;

    const totalRow = new Map<PayoutReviewTableColumnKey, CellDataType>([
      [
        PayoutReviewTableColumnKey.Member,
        {
          type: ColumnType.Other,
          value: (
            <div className='flex flex-row items-center gap-xsmall'>
              <Typography variant='h6'>{translate('Label.Total')}</Typography>
              {normalizedWatermarks && totalAllocation && (
                <IconButton
                  aria-label={translate('Action.ToggleBreakdown')}
                  size='small'
                  color='secondary'
                  variant='default'
                  onClick={() => setIsTotalExpanded((prev) => !prev)}>
                  {isTotalExpanded ? (
                    <ExpandLessIcon className='size-350' />
                  ) : (
                    <ExpandMoreIcon className='size-350' />
                  )}
                </IconButton>
              )}
            </div>
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
                <Typography variant='h6'>
                  {Intl.NumberFormat(locale ?? Locale.English).format(totalPayoutAmount)}
                </Typography>
              </div>
              {totalFiatUsd != null && totalFiatUsd > 0 && (
                <Typography
                  variant='caption'
                  className='font-semibold padding-left-xlarge text-align-x-left'>
                  {String(numberFormatter(totalFiatUsd, 'currency'))}
                </Typography>
              )}
            </div>
          ),
        },
      ],
    ]);

    payoutRows.push(totalRow);
    return payoutRows;
  }, [
    paginatedData,
    payouts,
    locale,
    page,
    pageSize,
    perRecipientAllocations,
    totalAllocation,
    normalizedWatermarks,
    isTotalExpanded,
    translate,
  ]);

  return (
    <>
      <GenericTableV2
        getRowKey={(_, index) => {
          if (index === paginatedData.length) {
            return 'total-row';
          }
          return paginatedData[index].user.id.toString();
        }}
        classes={tableClasses}
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
      {isTotalExpanded && totalAllocation && normalizedWatermarks && (
        <div className='margin-top-small'>
          <PayoutAllocationBreakdown
            allocation={totalAllocation}
            normalizedWatermarks={normalizedWatermarks}
            breakdownLayout={{
              labelGrow: 1,
              robuxGrow: 1,
              robuxLeftPaddingClass: 'padding-left-xxlarge',
            }}
          />
        </div>
      )}
    </>
  );
};

export default OneTimePayoutReviewTable;
