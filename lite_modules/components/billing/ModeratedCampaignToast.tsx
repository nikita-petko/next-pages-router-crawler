import { useEffect } from 'react';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AlertToast from '@components/billing/AlertToast';
import { TranslationNamespace } from '@constants/localization';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NUMBER_OF_MS_IN_A_DAY } from '@utils/date';
import { SetLocalStorage, StorageKeys } from 'app/lite_modules/utils/localStorage';

interface ModeratedCampaignToastProps {
  ctaAction: () => void;
}

const ModeratedCampaignToast = ({ ctaAction }: ModeratedCampaignToastProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);
  const handleCtaClick = () => {
    logNativeClickEvent(EventName.ModeratedCampaignBannerCTAClicked);
    ctaAction();
  };

  useEffect(() => {
    logNativeImpressionEvent(EventName.ModeratedCampaignBannerShown);
  }, []);

  return (
    <AlertToast
      alwaysShowCloseButton
      header={translate('Heading.ModeratedCampaign')}
      level={AlertToastLevel.Warning}
      onCloseButtonClick={() => {
        SetLocalStorage(
          StorageKeys.HAS_CLOSED_MODERATED_CAMPAIGN_BANNER,
          true,
          2 * NUMBER_OF_MS_IN_A_DAY,
        );
      }}
      onPrimaryButtonClick={handleCtaClick}
      primaryButtonText={translate('Action.ViewDetails')}
      text={translate('Description.ModeratedCampaignWarning')}
    />
  );
};

export default ModeratedCampaignToast;
