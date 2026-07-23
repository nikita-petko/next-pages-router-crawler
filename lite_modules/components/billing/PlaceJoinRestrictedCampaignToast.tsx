import { useEffect } from 'react';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AlertToast from '@components/billing/AlertToast';
import { TranslationNamespace } from '@constants/localization';
import { AlertToastLevel } from '@constants/toastConstants';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NUMBER_OF_MS_IN_A_DAY } from '@utils/date';
import { SetLocalStorage, StorageKeys } from 'app/lite_modules/utils/localStorage';

const PlaceJoinRestrictedCampaignToast = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Billing);

  useEffect(() => {
    logNativeImpressionEvent(EventName.PlaceJoinRestrictedBannerShown);
  }, []);

  return (
    <AlertToast
      alwaysShowCloseButton
      level={AlertToastLevel.Warning}
      onCloseButtonClick={() => {
        SetLocalStorage(
          StorageKeys.HAS_CLOSED_PLACE_JOIN_RESTRICTED_BANNER,
          true,
          2 * NUMBER_OF_MS_IN_A_DAY,
        );
      }}
      text={
        <span>
          <strong>{translate('Heading.PlaceJoinRestrictedCampaign')}</strong>
          {` ${translate('Description.PlaceJoinRestrictedCampaignWarning')}`}
        </span>
      }
    />
  );
};

export default PlaceJoinRestrictedCampaignToast;
