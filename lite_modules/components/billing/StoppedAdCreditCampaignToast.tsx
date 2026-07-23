import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AlertToast from '@components/billing/AlertToast';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { SetLocalStorage, StorageKeys } from 'app/lite_modules/utils/localStorage';

const StoppedAdCreditCampaignToast = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const router = useRouter();
  const handleCtaClick = () => {
    logNativeClickEvent(EventName.PausedAdCreditBannerCTAClicked);
    router.push(Routes.ADD_PAYMENT);
  };

  useEffect(() => {
    logNativeImpressionEvent(EventName.PausedAdCreditBannerShown);
  }, []);

  return (
    <AlertToast
      alwaysShowCloseButton
      header={translate('Heading.PausedAdCreditCampaign')}
      level={AlertToastLevel.Warning}
      onCloseButtonClick={() => {
        SetLocalStorage(StorageKeys.HAS_CLOSED_AD_CREDIT_BANNER, true);
      }}
      onPrimaryButtonClick={handleCtaClick}
      primaryButtonText={translate('Heading.PaymentSettings')}
      text={translate('Description.PausedAdCreditCampaign')}
    />
  );
};

export default StoppedAdCreditCampaignToast;
