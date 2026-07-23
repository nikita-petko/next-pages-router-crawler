import {
  Button,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { Typography } from '@rbx/ui';
import moment from 'moment-timezone';
import { useCallback, useState } from 'react';

import useCardTransactionHistoryStyles from '@components/billing/payment_activity/CardTransactionHistory.styles';
import useTransactionHistoryStyles from '@components/billing/payment_activity/TransactionHistory.styles';
import headerStyles from '@components/billing/payment_activity/TransactionHistoryTable.module.css';
import useCampaignManagementTableStyles from '@components/reporting/CampaignManagementTable.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import {
  ChargeRequestStatusEnum,
  ListPaymentActivitiesResponseType,
  PaymentActivityType,
} from '@type/payment';
import { NumberToCommaSeparatedWithTwoDecimalPlacesString } from '@utils/currency';
import { CaptureException } from '@utils/error';
import { GetTimezoneObjFromEnum } from '@utils/timezone';

const headerCellClassName = `sticky top-0 bg-surface-100 ${headerStyles.stickyHeaderCell}`;

interface CardTransactionHistoryRowProps {
  paymentActivity: PaymentActivityType;
}

const CardTransactionHistoryRow = ({ paymentActivity }: CardTransactionHistoryRowProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const {
    classes: {
      paymentStatusCellContents,
      statusCircle,
      statusCircleError,
      statusCircleInfo,
      statusCircleSuccess,
    },
    cx,
  } = useCardTransactionHistoryStyles();
  const { organizationInfo } = useAppStore((state: AppStoreType) => state.appData);

  const usersTimezone = organizationInfo.time_zone;
  const timezoneDbName = GetTimezoneObjFromEnum(usersTimezone)?.timezoneDbName;
  const dateString = moment
    .tz(paymentActivity.charge_time_ms, timezoneDbName)
    .format('MMM D, YYYY');

  const isFailedCharge = paymentActivity?.charge_request_status === ChargeRequestStatusEnum.Failed;
  const isRefund = Boolean(paymentActivity?.refund_request_status);

  let statusText;
  let statusCircleClassName = statusCircleSuccess;
  if (isRefund) {
    statusText = translate('Label.Refund');
    statusCircleClassName = statusCircleInfo;
  } else if (isFailedCharge) {
    statusText = translate('Label.Failed');
    statusCircleClassName = statusCircleError;
  } else {
    statusText = translate('Label.Succeeded');
  }

  const formattedChargeAmount = NumberToCommaSeparatedWithTwoDecimalPlacesString(
    Math.abs(paymentActivity.charge_amount),
  );
  const refundMinusSign = isRefund && paymentActivity.charge_amount !== 0 ? '- ' : '';
  const amountChargedText = `${refundMinusSign}${formattedChargeAmount} ${paymentActivity.currency_code}`;
  let amountChargedCellContent = (
    <Typography data-testid='amountChargedCellContent' noWrap variant='body2'>
      {amountChargedText}
    </Typography>
  );

  if (isFailedCharge && paymentActivity?.request_amount) {
    const formattedRequestAmount = NumberToCommaSeparatedWithTwoDecimalPlacesString(
      Math.abs(paymentActivity?.request_amount),
    );
    const hoverRequestAmountText = translate('Description.AttemptedCharge', {
      amount: formattedRequestAmount,
      currency: String(paymentActivity.currency_code),
    });
    amountChargedCellContent = (
      <Tooltip position='left-center' title={hoverRequestAmountText}>
        <TooltipTrigger asChild>
          <span className='inline-block'>{amountChargedCellContent}</span>
        </TooltipTrigger>
      </Tooltip>
    );
  }

  return (
    <TableRow data-testid={`transactionHistoryRow-${paymentActivity.charge_time_ms}`}>
      <TableCell align='start' data-testid='transactionDateCell'>
        <Typography data-testid='transactionDateCellContent' noWrap variant='body2'>
          {dateString}
        </Typography>
      </TableCell>
      <TableCell align='start' data-testid='paymentMethodCell'>
        <Typography data-testid='paymentMethodCellContent' noWrap variant='body2'>
          {translate('Title.Card')} ****{paymentActivity.last_four_digits}
        </Typography>
      </TableCell>
      <TableCell align='start' data-testid='paymentStatusCell'>
        <div className={paymentStatusCellContents}>
          <div className={cx(statusCircle, statusCircleClassName)} />
          <Typography data-testid='paymentStatusCellContent' noWrap variant='body2'>
            {statusText}
          </Typography>
        </div>
      </TableCell>
      <TableCell align='end' data-testid='amountChargedCell'>
        {amountChargedCellContent}
      </TableCell>
    </TableRow>
  );
};

interface TransactionHistoryGridProps {
  hasMore: boolean;
  loadMore: (endTimeMs: number) => Promise<ListPaymentActivitiesResponseType>;
  paymentActivities: PaymentActivityType[];
}

const TransactionHistoryGrid = ({
  hasMore,
  loadMore,
  paymentActivities,
}: TransactionHistoryGridProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const {
    classes: { campaignTable },
  } = useCampaignManagementTableStyles();
  const {
    classes: {
      failedtoLoadMoreTransactionsContainer,
      failedToLoadMoreTransactionsIcon,
      footerContainer,
      transactionHistoryGrid,
    },
  } = useTransactionHistoryStyles();

  const [items, setItems] = useState<Array<PaymentActivityType>>(
    paymentActivities.sort((a, b) => b.charge_time_ms - a.charge_time_ms),
  );
  const [endTimeMs, setEndTimeMs] = useState<number>(
    Math.min(...paymentActivities.map((item) => item.request_time_ms)),
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldShowLoadMore, setShouldShowLoadMore] = useState<boolean>(hasMore);
  const [didLoadMoreSucceed, setDidLoadMoreSucceed] = useState<boolean>(true);
  const onLoadMoreButtonClick = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadMoreResponse = await loadMore(endTimeMs - 100);
      setDidLoadMoreSucceed(true);
      const newItems = loadMoreResponse.activities;
      setItems((prevItems) => [
        ...prevItems,
        ...newItems.sort((a, b) => b.charge_time_ms - a.charge_time_ms),
      ]);
      if (newItems.length > 0) {
        setEndTimeMs(Math.min(...newItems.map((item) => item.request_time_ms)));
      }
      setShouldShowLoadMore(loadMoreResponse.has_more);
    } catch (error) {
      CaptureException(error as Error);
      setDidLoadMoreSucceed(false);
    }
    setIsLoading(false);
  }, [endTimeMs, loadMore]);

  return (
    <div className={transactionHistoryGrid} data-testid='transactionHistoryGrid'>
      <div className={`${campaignTable} width-full min-width-0`}>
        <div className='min-width-max'>
          <Table variant='Framed'>
            <TableHeader>
              <TableRow data-testid='transactionHistoryRowHeaders'>
                <TableHeaderCell
                  align='start'
                  className={headerCellClassName}
                  data-testid='transactionDateCellHeader'>
                  <span
                    className='inline-flex items-center'
                    data-testid='transactionDateCellHeaderContent'>
                    {translate('Title.TransactionDate')}
                  </span>
                </TableHeaderCell>
                <TableHeaderCell
                  align='start'
                  className={headerCellClassName}
                  data-testid='paymentMethodCellHeader'>
                  <span
                    className='inline-flex items-center'
                    data-testid='paymentMethodCellHeaderContent'>
                    {translate('Title.PaymentMethod')}
                  </span>
                </TableHeaderCell>
                <TableHeaderCell
                  align='start'
                  className={headerCellClassName}
                  data-testid='paymentStatusCellHeader'>
                  <span
                    className='inline-flex items-center'
                    data-testid='paymentStatusCellHeaderContent'>
                    {translate('Title.PaymentStatus')}
                  </span>
                </TableHeaderCell>
                <TableHeaderCell
                  align='end'
                  className={headerCellClassName}
                  data-testid='amountChargedCellHeader'>
                  <span
                    className='inline-flex items-center'
                    data-testid='amountChargedCellHeaderContent'>
                    {translate('Title.CardAmountCharged')}
                  </span>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((activity) => (
                <CardTransactionHistoryRow
                  key={activity.charge_time_ms.toString()}
                  paymentActivity={activity}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {!didLoadMoreSucceed ? (
        <div className={failedtoLoadMoreTransactionsContainer}>
          <Icon
            className={failedToLoadMoreTransactionsIcon}
            name='icon-regular-triangle-exclamation'
            size='Medium'
          />
          <Typography data-testid='failedtoLoadMoreTransactionsText' variant='body1'>
            {translate('Description.FailedToLoadMoreTransactions')}
          </Typography>
        </div>
      ) : null}
      {shouldShowLoadMore && !isLoading ? (
        <div className={footerContainer}>
          <Button
            className='width-full'
            data-testid='loadMoreButton'
            onClick={onLoadMoreButtonClick}
            size='Small'
            variant='Emphasis'>
            {translate('Action.LoadMore')}
          </Button>
        </div>
      ) : null}
      {!shouldShowLoadMore ? (
        <div className={footerContainer}>
          <Typography color='inherit' data-testid='noMoreText' variant='footer'>
            {translate('Description.EndOfTransactionHistory')}
          </Typography>
        </div>
      ) : null}
    </div>
  );
};

interface TransactionHistoryProps {
  hasMore: boolean;
  initialLoadSucceeded: boolean;
  loadMore: (endTimeMs: number) => Promise<ListPaymentActivitiesResponseType>;
  paymentActivities: Array<PaymentActivityType> | null;
}

const CardTransactionHistory = ({
  hasMore,
  initialLoadSucceeded,
  loadMore,
  paymentActivities,
}: TransactionHistoryProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const {
    classes: {
      failedToGetTransactionsContainer,
      failedToLoadTransactionsIcon,
      noTransactionHistoryContainer,
      transactionHistoryContainer,
    },
  } = useTransactionHistoryStyles();

  const failedToGetTransactionHistoryTextContainer = (
    <div className={failedToGetTransactionsContainer}>
      <Icon
        className={failedToLoadTransactionsIcon}
        name='icon-regular-triangle-exclamation'
        size='Medium'
      />
      <Typography data-testid='failedToGetTransactionHistoryText' variant='body1'>
        {translate('Description.FailedToLoadTransactionHistory')}
      </Typography>
    </div>
  );
  if (!initialLoadSucceeded || paymentActivities == null) {
    return (
      <div className={transactionHistoryContainer} data-testid='transactionHistoryContainer'>
        {failedToGetTransactionHistoryTextContainer}
      </div>
    );
  }

  const noTransactionHistoryTextContainer = (
    <div className={noTransactionHistoryContainer}>
      <Typography data-testid='noTransactionHistoryText' variant='body1'>
        {translate('Description.NoTransactionHistoryV2')}
      </Typography>
    </div>
  );
  const transactionHistory = (
    <TransactionHistoryGrid
      hasMore={hasMore}
      loadMore={loadMore}
      paymentActivities={paymentActivities}
    />
  );

  return (
    <div className={transactionHistoryContainer} data-testid='transactionHistoryContainer'>
      {paymentActivities.length === 0 ? noTransactionHistoryTextContainer : transactionHistory}
    </div>
  );
};

export default CardTransactionHistory;
