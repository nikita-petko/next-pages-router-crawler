import { useRouter } from 'next/router';
import { useCallback } from 'react';

import AlertToast from '@components/billing/AlertToast';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { retryPaymentCharges } from '@services/ads/paymentService';
import { CaptureException } from '@utils/error';

const PaymentFailedToast = () => {
  const router = useRouter();
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);

  const navigateToAddPaymentMethod = () => {
    router.push(Routes.ADD_PAYMENT);
  };

  const handleRetryPaymentButtonClick = useCallback(async () => {
    try {
      await retryPaymentCharges();
      router.reload();
    } catch (e) {
      CaptureException(e as Error);
    }
  }, [router]);

  return (
    <AlertToast
      header={translate('Heading.PaymentMethodDeclined')}
      level={AlertToastLevel.Error}
      onPrimaryButtonClick={navigateToAddPaymentMethod}
      onSecondaryButtonClick={handleRetryPaymentButtonClick}
      primaryButtonText={translate('Action.ReplaceCard')}
      secondaryButtonText={translate('Action.RetryPayment')}
      text={translate('Description.PausedCampaignsUntilVerifiedPaymentMethod')}
    />
  );
};

export default PaymentFailedToast;
