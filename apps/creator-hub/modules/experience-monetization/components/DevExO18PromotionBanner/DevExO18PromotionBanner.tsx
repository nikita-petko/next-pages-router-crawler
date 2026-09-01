import { memo } from 'react';
import { O18Eligibility } from '@modules/clients/creatorDevexApi';
import useDevExO18BannerDismissal from '../../hooks/useDevExO18BannerDismissal';
import DevExO18EligibleBanner from './DevExO18EligibleBanner';
import DevExO18UpsellBanner from './DevExO18UpsellBanner';

type DevExO18PromotionBannerProps = {
  universeId: number;
  o18EligibilityState: O18Eligibility;
  className?: string;
};

function DevExO18PromotionBanner({
  universeId,
  o18EligibilityState,
  className,
}: DevExO18PromotionBannerProps) {
  const { isUpsellBannerOpen, isEligibleBannerOpen, closeUpsellBanner, closeEligibleBanner } =
    useDevExO18BannerDismissal(universeId);

  switch (o18EligibilityState) {
    case O18Eligibility.Ineligible:
      return isUpsellBannerOpen ? (
        <DevExO18UpsellBanner
          universeId={universeId}
          onClose={closeUpsellBanner}
          className={className}
        />
      ) : null;
    case O18Eligibility.Eligible:
      return isEligibleBannerOpen ? (
        <DevExO18EligibleBanner
          universeId={universeId}
          onClose={closeEligibleBanner}
          className={className}
        />
      ) : null;
    case O18Eligibility.None:
    case O18Eligibility.Invalid:
      return null;
    default: {
      const exhaustiveCheck: never = o18EligibilityState;
      void exhaustiveCheck;
      return null;
    }
  }
}

export default memo(DevExO18PromotionBanner);
