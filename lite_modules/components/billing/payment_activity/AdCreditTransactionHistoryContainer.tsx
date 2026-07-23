import { useCallback, useEffect, useState } from 'react';

import AdCreditTransactionHistory from '@components/billing/payment_activity/AdCreditTransactionHistory';
import { PendingAdCreditTransaction } from '@constants/billing';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getAdCreditTransactionHistory } from '@services/ads/adAccountFinanceService';
import { useAppStore } from '@stores/appStoreProvider';
import { AdCreditTransaction } from '@type/payment';
import { CaptureException } from '@utils/error';
import {
  isGroupAdAccountMissing,
  isMissingGroupAdAccountHistoryError,
} from '@utils/groupAdAccountSetup';

interface AdCreditTransactionHistoryContainerProps {
  groupId?: number;
}

const AdCreditTransactionHistoryContainer = ({
  groupId,
}: AdCreditTransactionHistoryContainerProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const groupAdvertiserState = useAppStore((state) =>
    groupId ? state.groupScopedAccountStateByGroupId[groupId]?.advertiserState : undefined,
  );
  const shouldHideForMissingGroupAccount =
    groupId !== undefined && isGroupAdAccountMissing(groupAdvertiserState);
  // Get ad credit transaction history
  const pageSize = 50;
  const unbilledBalance = useAppStore((state) =>
    groupId
      ? state.groupScopedAccountStateByGroupId[groupId]?.adCreditState?.data
          ?.unbilled_balance_micro_usd || 0
      : state.adCreditState.data?.unbilled_balance_micro_usd || 0,
  );
  const [isLoadingPaymentActivities, setIsLoadingPaymentActivities] = useState<boolean>(true);
  const [paymentActivities, setPaymentActivities] = useState<Array<AdCreditTransaction> | null>(
    null,
  );
  const [initialNextCursor, setInitialNextCursor] = useState<string>('');
  const [didInitialLoadSucceed, setDidInitialLoadSucceed] = useState<boolean>(false);
  const [hideForMissingGroupAccount, setHideForMissingGroupAccount] = useState<boolean>(
    shouldHideForMissingGroupAccount,
  );
  const initialPaymentActivities = useCallback(async () => {
    if (shouldHideForMissingGroupAccount) {
      setHideForMissingGroupAccount(true);
      setIsLoadingPaymentActivities(false);
      return;
    }

    try {
      const adCreditTransactionHistory = await getAdCreditTransactionHistory(pageSize, '', groupId);
      if (adCreditTransactionHistory.ad_credit_transaction_history === null) {
        if (groupId !== undefined) {
          setHideForMissingGroupAccount(true);
        }
        return;
      }
      setDidInitialLoadSucceed(true);
      let transactions = adCreditTransactionHistory.ad_credit_transaction_history;
      if (unbilledBalance) {
        transactions = [
          { ...PendingAdCreditTransaction, ad_credit_micros: unbilledBalance },
          ...transactions,
        ];
      }
      setPaymentActivities(transactions);
      setInitialNextCursor(adCreditTransactionHistory.next_cursor);
    } catch (error) {
      if (groupId !== undefined && isMissingGroupAdAccountHistoryError(error)) {
        setHideForMissingGroupAccount(true);
      } else {
        CaptureException(error as Error);
      }
    }
    setIsLoadingPaymentActivities(false);
  }, [groupId, shouldHideForMissingGroupAccount, unbilledBalance]);

  // Get more transaction history
  const loadMore = useCallback(
    async (nextCursor: string) => {
      try {
        const adCreditTransactionHistory = await getAdCreditTransactionHistory(
          pageSize,
          nextCursor,
          groupId,
        );
        return adCreditTransactionHistory;
      } catch (error) {
        CaptureException(error as Error);
        throw new Error(translate('Error.FailedToLoadActivities'));
      }
    },
    [groupId, translate],
  );

  // On page load, fetch payment activity
  useEffect(() => {
    initialPaymentActivities();
  }, [initialPaymentActivities]);

  if (hideForMissingGroupAccount) {
    return null;
  }

  return isLoadingPaymentActivities ? null : (
    <AdCreditTransactionHistory
      cursor={initialNextCursor}
      initialLoadSucceeded={didInitialLoadSucceed}
      loadMore={loadMore}
      paymentActivities={paymentActivities}
      showPurchasedByColumn={groupId !== undefined}
    />
  );
};

export default AdCreditTransactionHistoryContainer;
