import { Banner } from '@rbx/ui';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import usePromotionBannerStyles from '@components/reporting/PromotionBanner.styles';
import ErrorCodes from '@constants/errorCodes';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { claimPromotions } from '@services/ads/claimPromotionsService';
import { usePromotionStore } from '@stores/promotionStoreProvider';
import { useToastStore } from '@stores/toastStoreProvider';
import { MicroUsdToUsdStringRoundedDownNoDecimals } from '@utils/currency';

const PromotionBanner = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const {
    setShowClaimPromotionError,
    setShowClaimPromotionSuccessful,
    setShowClaimPromotionWarning,
  } = useToastStore();

  const getPromotions = usePromotionStore((state) => state.getPromotions);
  const promotions = usePromotionStore((state) => state.promotions?.data);
  const hasActivePromotion = promotions && promotions.length > 0;

  const {
    classes: { bannerRoot, textContainer },
  } = usePromotionBannerStyles();

  const [claimAdCreditIsLoading, setClaimAdCreditIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (hasActivePromotion) {
      logNativeImpressionEvent(EventName.PromotionBannerRendered);
    }
  }, [hasActivePromotion]);

  return hasActivePromotion ? (
    <Banner
      classes={{ root: bannerRoot }}
      description={
        <div className={textContainer}>
          <span className='text-body-large content-default'>
            {translate('Description.UseAdsManager')}
          </span>
        </div>
      }
      illustration={{
        alt: translate('Description.UseAdsManager'),
        src: `${process.env.assetPathPrefix}/common/promotion_image.png`,
      }}
      primary={{
        color: 'primary',
        disabled: claimAdCreditIsLoading,
        label: translate('Action.RedeemCredit'),
        onClick: () => {
          logNativeClickEvent(EventName.ClaimPromotionClicked);
          setClaimAdCreditIsLoading(true);
          claimPromotions(promotions[0].promotion_id)
            .then(() => {
              setShowClaimPromotionSuccessful(true);
              getPromotions();
            })
            .catch((error) => {
              if (
                error instanceof AxiosError &&
                error.response?.data?.error?.code === ErrorCodes.ALREADY_CLAIMED
              ) {
                setShowClaimPromotionWarning(true);
                getPromotions();
              } else {
                setShowClaimPromotionError(true);
              }
            })
            .finally(() => {
              setClaimAdCreditIsLoading(false);
            });
        },
        size: 'large',
      }}
      title={translate('Description.ClaimAdCredits', {
        amount: MicroUsdToUsdStringRoundedDownNoDecimals(promotions[0].ad_credit_micros),
      })}
    />
  ) : null;
};

export default PromotionBanner;
