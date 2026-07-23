import {
  Avatar,
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
import { useCallback, useEffect, useMemo, useState } from 'react';

import useAdCreditTransactionHistoryStyles from '@components/billing/payment_activity/AdCreditTransactionHistory.styles';
import useTransactionHistoryStyles from '@components/billing/payment_activity/TransactionHistory.styles';
import headerStyles from '@components/billing/payment_activity/TransactionHistoryTable.module.css';
import useCampaignManagementTableStyles from '@components/reporting/CampaignManagementTable.styles';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import { AdCreditTransactionType } from '@constants/payment';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { UserProfileStoreType, useUserProfileStore } from '@stores/userProfileStoreProvider';
import { AdCreditTransaction, AdCreditTransactionHistoryResult } from '@type/payment';
import { MicroUsdToUsdString } from '@utils/currency';
import { CaptureException } from '@utils/error';
import { GetTimezoneObjFromEnum } from '@utils/timezone';

const headerCellClassName = `sticky top-0 bg-surface-100 ${headerStyles.stickyHeaderCell}`;

const parseActorUserId = (actorUserId?: string): number | undefined => {
  if (!actorUserId) {
    return undefined;
  }
  const parsed = Number(actorUserId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

interface PurchasedByCellProps {
  actorUserId?: string;
}

const PurchasedByCell = ({ actorUserId }: PurchasedByCellProps) => {
  const {
    classes: { purchasedByAvatar, purchasedByCellContent },
  } = useAdCreditTransactionHistoryStyles();
  const userId = parseActorUserId(actorUserId);
  const profile = useUserProfileStore((state: UserProfileStoreType) =>
    userId !== undefined ? state.userProfilesByUserId[userId] : undefined,
  );

  if (userId === undefined) {
    return (
      <Typography noWrap variant='body2'>
        {UNAVAILABLE_VALUE_DISPLAY}
      </Typography>
    );
  }

  const username = profile?.data?.username;
  if (!username) {
    return (
      <Typography noWrap variant='body2'>
        {UNAVAILABLE_VALUE_DISPLAY}
      </Typography>
    );
  }

  return (
    <div className={purchasedByCellContent}>
      <Avatar
        alt={username}
        className={purchasedByAvatar}
        size='Small'
        src={profile.data?.avatarUrl}
      />
      <Typography noWrap variant='body2'>
        {username}
      </Typography>
    </div>
  );
};

interface AdCreditTransactionHistoryRowProps {
  paymentActivity: AdCreditTransaction;
  showPurchasedByColumn: boolean;
}

const AdCreditTransactionHistoryRow = ({
  paymentActivity,
  showPurchasedByColumn,
}: AdCreditTransactionHistoryRowProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const {
    classes: { activityEllipsis },
  } = useAdCreditTransactionHistoryStyles();
  const { organizationInfo } = useAppStore((state: AppStoreType) => state.appData);

  const usersTimezone = organizationInfo.time_zone;
  const timezoneDbName = GetTimezoneObjFromEnum(usersTimezone)?.timezoneDbName;
  let dateString = moment
    .tz(paymentActivity.created_timestamp_ms, timezoneDbName)
    .format('MMM D, YYYY');
  const campaignId = paymentActivity.campaign_id;
  const campaignName = paymentActivity.campaign_name;
  const adCreditActivityHoverContent = campaignName
    ? translate('Description.CampaignNameTooltip', { campaignName: String(campaignName) })
    : '';
  const adCreditAmount = MicroUsdToUsdString(paymentActivity.ad_credit_micros);

  let isDebit = false;
  let activityToDisplay = translate('Description.PurchasedAdCredits');
  if (campaignId) {
    if (
      paymentActivity.transaction_type === AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_DEBIT
    ) {
      activityToDisplay = translate('Description.Funded');
      isDebit = true;
    } else if (
      paymentActivity.transaction_type === AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_REFUND
    ) {
      activityToDisplay = translate('Description.Unused');
    }
  } else if (
    paymentActivity.transaction_type ===
    AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_ADJUSTMENT
  ) {
    activityToDisplay = translate('Description.OneOffRefund');
  } else if (
    paymentActivity.transaction_type ===
    AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_PROMOTION
  ) {
    activityToDisplay = translate('Description.AdCreditApplied');
  } else if (
    paymentActivity.transaction_type === AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_DEBIT
  ) {
    activityToDisplay = translate('Description.Charged');
    isDebit = true;
  } else if (
    paymentActivity.transaction_type === AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_REFUND
  ) {
    activityToDisplay = translate('Description.Refunded');
  } else if (
    paymentActivity.transaction_type ===
    AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_PENDING_UNBILLED
  ) {
    activityToDisplay = translate('Description.Pending');
    isDebit = true;
    dateString = UNAVAILABLE_VALUE_DISPLAY;
  } else if (
    paymentActivity.transaction_type ===
    AdCreditTransactionType.AD_CREDIT_TRANSACTION_TYPE_AUTO_DEPOSIT
  ) {
    activityToDisplay = translate('Description.AutoPurchasedAdCredit');
  }

  const activityCellContent = (
    <Typography
      classes={{ root: activityEllipsis }}
      data-testid='paymentMethodCellContent'
      noWrap
      variant='body2'>
      {activityToDisplay}
      {campaignName ? (
        <>
          <br />
          {campaignName}
        </>
      ) : null}
    </Typography>
  );

  return (
    <TableRow data-testid={`transactionHistoryRow-${paymentActivity.created_timestamp_ms}`}>
      <TableCell align='start' data-testid='transactionDateCell'>
        <Typography data-testid='transactionDateCellContent' noWrap variant='body2'>
          {dateString}
        </Typography>
      </TableCell>
      <TableCell align='start' data-testid='paymentMethodCell'>
        {campaignName ? (
          <Tooltip position='left-center' title={adCreditActivityHoverContent}>
            <TooltipTrigger asChild>
              <span className='inline-block'>{activityCellContent}</span>
            </TooltipTrigger>
          </Tooltip>
        ) : (
          activityCellContent
        )}
      </TableCell>
      {showPurchasedByColumn ? (
        <TableCell align='start' data-testid='purchasedByCell'>
          <PurchasedByCell actorUserId={paymentActivity.actor_user_id} />
        </TableCell>
      ) : null}
      <TableCell align='end' data-testid='amountChargedCell'>
        <Typography data-testid='amountChargedCellContent' noWrap variant='body2'>
          {isDebit ? `-${adCreditAmount}` : adCreditAmount}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

interface TransactionHistoryGridProps {
  cursor: string;
  loadMore: (nextCursor: string) => Promise<AdCreditTransactionHistoryResult>;
  paymentActivities: AdCreditTransaction[];
  showPurchasedByColumn: boolean;
}

const TransactionHistoryGrid = ({
  cursor,
  loadMore,
  paymentActivities,
  showPurchasedByColumn,
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
  const getUserProfilesBatch = useUserProfileStore(
    (state: UserProfileStoreType) => state.getUserProfilesBatch,
  );

  const [items, setItems] = useState<AdCreditTransaction[]>(paymentActivities);
  const [nextCursor, setNextCursor] = useState<string>(cursor);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shouldShowLoadMore, setShouldShowLoadMore] = useState<boolean>(Boolean(nextCursor));
  const [didLoadMoreSucceed, setDidLoadMoreSucceed] = useState<boolean>(true);

  const actorUserIds = useMemo(() => {
    if (!showPurchasedByColumn) {
      return [];
    }

    return Array.from(
      new Set(
        items
          .map((item) => parseActorUserId(item.actor_user_id))
          .filter((userId): userId is number => userId !== undefined),
      ),
    );
  }, [items, showPurchasedByColumn]);

  useEffect(() => {
    if (!showPurchasedByColumn || actorUserIds.length === 0) {
      return;
    }

    getUserProfilesBatch(actorUserIds).catch(() => undefined);
  }, [actorUserIds, getUserProfilesBatch, showPurchasedByColumn]);

  const onLoadMoreButtonClick = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadMoreResponse = await loadMore(nextCursor);
      setDidLoadMoreSucceed(true);
      const newItems = loadMoreResponse.ad_credit_transaction_history;
      setItems((prevItems) => [...prevItems, ...newItems]);
      setNextCursor(loadMoreResponse.next_cursor);
      setShouldShowLoadMore(Boolean(loadMoreResponse?.next_cursor));
    } catch (error) {
      CaptureException(error as Error);
      setDidLoadMoreSucceed(false);
    }
    setIsLoading(false);
  }, [loadMore, nextCursor]);

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
                    {translate('Title.Activities')}
                  </span>
                </TableHeaderCell>
                {showPurchasedByColumn ? (
                  <TableHeaderCell
                    align='start'
                    className={headerCellClassName}
                    data-testid='purchasedByCellHeader'>
                    <span
                      className='inline-flex items-center'
                      data-testid='purchasedByCellHeaderContent'>
                      {translate('Label.PurchasedBy')}
                    </span>
                  </TableHeaderCell>
                ) : null}
                <TableHeaderCell
                  align='end'
                  className={headerCellClassName}
                  data-testid='amountChargedCellHeader'>
                  <span
                    className='inline-flex items-center'
                    data-testid='amountChargedCellHeaderContent'>
                    {translate('Title.AdCreditAmount')}
                  </span>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((activity) => (
                <AdCreditTransactionHistoryRow
                  key={activity.id.toString()}
                  paymentActivity={activity}
                  showPurchasedByColumn={showPurchasedByColumn}
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
  cursor: string;
  initialLoadSucceeded: boolean;
  loadMore: (nextCursor: string) => Promise<AdCreditTransactionHistoryResult>;
  paymentActivities: Array<AdCreditTransaction> | null;
  showPurchasedByColumn?: boolean;
}

const AdCreditTransactionHistory = ({
  cursor,
  initialLoadSucceeded,
  loadMore,
  paymentActivities,
  showPurchasedByColumn = false,
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
      cursor={cursor}
      loadMore={loadMore}
      paymentActivities={paymentActivities}
      showPurchasedByColumn={showPurchasedByColumn}
    />
  );

  return (
    <div className={transactionHistoryContainer} data-testid='transactionHistoryContainer'>
      {paymentActivities.length === 0 ? noTransactionHistoryTextContainer : transactionHistory}
    </div>
  );
};

export default AdCreditTransactionHistory;
