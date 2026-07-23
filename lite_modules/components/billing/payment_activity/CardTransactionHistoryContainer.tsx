import { useCallback, useEffect, useState } from 'react';

import CardTransactionHistory from '@components/billing/payment_activity/CardTransactionHistory';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { listSucceededAndFailedPaymentActivities } from '@services/ads/adAccountFinanceService';
import { PaymentActivityType } from '@type/payment';
import { CaptureException } from '@utils/error';

const CardTransactionHistoryContainer = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  // Get payment transaction history
  const pageSize = 50;
  const [isLoadingPaymentActivities, setIsLoadingPaymentActivities] = useState<boolean>(true);
  const [paymentActivities, setPaymentActivities] = useState<Array<PaymentActivityType> | null>(
    null,
  );
  const [hasMorePaymentActivities, setHasMorePaymentActivities] = useState<boolean>(false);
  const [didInitialLoadSucceed, setDidInitialLoadSucceed] = useState<boolean>(false);
  const initialPaymentActivities = useCallback(async () => {
    try {
      const listPaymentActivitiesResponse = await listSucceededAndFailedPaymentActivities(
        0,
        pageSize,
      );
      if (listPaymentActivitiesResponse.activities === null) {
        return;
      }
      setDidInitialLoadSucceed(true);
      setPaymentActivities(
        listPaymentActivitiesResponse.activities.sort(
          (a, b) => b.charge_time_ms - a.charge_time_ms,
        ),
      );
      setHasMorePaymentActivities(listPaymentActivitiesResponse.has_more);
    } catch (error) {
      CaptureException(error as Error);
    }
    setIsLoadingPaymentActivities(false);
  }, []);

  // Get more transaction history
  const loadMore = useCallback(
    async (endTimeMs: number) => {
      try {
        const listPaymentActivitiesResponse = await listSucceededAndFailedPaymentActivities(
          endTimeMs,
          pageSize,
        );
        return listPaymentActivitiesResponse;
      } catch (error) {
        CaptureException(error as Error);
        throw new Error(translate('Error.FailedToLoadActivities'));
      }
    },
    [translate],
  );

  // On page load, retrieve balance, payment activity, and any account issues that require a banner
  useEffect(() => {
    initialPaymentActivities();
  }, [initialPaymentActivities]);

  return isLoadingPaymentActivities ? null : (
    <CardTransactionHistory
      hasMore={hasMorePaymentActivities}
      initialLoadSucceeded={didInitialLoadSucceed}
      loadMore={loadMore}
      paymentActivities={paymentActivities}
    />
  );
};

export default CardTransactionHistoryContainer;
