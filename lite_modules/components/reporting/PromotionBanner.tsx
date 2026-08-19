import { Button } from '@rbx/foundation-ui';
import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import Pictogram from '@components/common/Pictogram';
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

  const [claimAdCreditIsLoading, setClaimAdCreditIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (hasActivePromotion) {
      logNativeImpressionEvent(EventName.PromotionBannerRendered);
    }
  }, [hasActivePromotion]);

  const handleRedeemClick = (promotionId: number) => {
    logNativeClickEvent(EventName.ClaimPromotionClicked);
    setClaimAdCreditIsLoading(true);
    claimPromotions(promotionId)
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
  };

  return hasActivePromotion ? (
    // `shift-200`, not `surface-200`: the latter sits two steps above the page in
    // dark mode but resolves to the same white as `surface-0` in light mode, which
    // would leave the banner with no visible fill. `shift-200` is the translucent
    // fill Foundation's `Card variant='Emphasis'` uses, so this reads as a card
    // alongside the reporting summary cards in both modes.
    <div className='flex width-full items-center justify-between clip radius-large bg-shift-200 margin-bottom-medium'>
      {/* 32px overshoots the Foundation padding scale, which stops at 24px, but
          it is what the banner spec calls for. */}
      <div className='flex min-width-0 flex-col justify-center gap-xxlarge padding-[32px] [flex:1_0_0]'>
        <div className='flex flex-col gap-small'>
          <h2 className='margin-[0px] text-heading-medium content-emphasis'>
            {translate('Description.ClaimAdCredits', {
              amount: MicroUsdToUsdStringRoundedDownNoDecimals(promotions[0].ad_credit_micros),
            })}
          </h2>
          <p className='margin-[0px] text-body-medium content-default'>
            {translate('Description.UseAdsManager')}
          </p>
        </div>
        <div className='flex wrap gap-medium'>
          <Button
            isDisabled={claimAdCreditIsLoading}
            isLoading={claimAdCreditIsLoading}
            onClick={() => handleRedeemClick(promotions[0].promotion_id)}
            size='Large'
            variant='Standard'>
            {translate('Action.RedeemCredit')}
          </Button>
        </div>
      </div>
      {/* Decorative, and the first thing to go when the copy needs the width.
          It bleeds to the banner's right edge like the spec's illustration
          slot, so the only margin is the pictogram's own tilt padding. */}
      <div className='hidden shrink-0 items-center self-stretch medium:flex'>
        <Pictogram
          icons={['icon-regular-chart-scatter-plot', 'icon-regular-tilt', 'icon-regular-megaphone']}
        />
      </div>
    </div>
  ) : null;
};

export default PromotionBanner;
