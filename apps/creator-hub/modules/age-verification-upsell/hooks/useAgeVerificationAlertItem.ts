import { useTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { UnifiedAlertItem } from '@modules/unified-alerts/types';
import { useAgeVerificationUpsellContext } from '../context/AgeVerificationUpsellContext';

/**
 * Hook that returns age verification alert data as a UnifiedAlertItem.
 * This is the single source of truth for age verification alert content.
 * Used by both AgeVerificationUpsellBanner and unified alert systems.
 */
export const useAgeVerificationAlertItem = (): UnifiedAlertItem | null => {
  const { translate } = useTranslation();
  const {
    settings: {
      ageVerificationUpsellGetStartedUrl,
      ageVerificationUpsellViewDetailsUrl,
      establishTrustUpsellGetStartedUrl,
      establishTrustUpsellViewDetailsUrl,
    },
  } = useSettings();
  const { isBannerVisible, variant } = useAgeVerificationUpsellContext();

  let titleTextKey: string;
  let callToActionUrl: string;
  let learnMoreLink: string;
  switch (variant) {
    case 'establishTrust':
      titleTextKey = 'Title.EstablishTrustBanner';
      callToActionUrl = establishTrustUpsellGetStartedUrl;
      learnMoreLink = establishTrustUpsellViewDetailsUrl;
      break;
    case 'ageVerification':
    default:
      titleTextKey = 'Title.AgeVerificationRequired';
      callToActionUrl = ageVerificationUpsellGetStartedUrl;
      learnMoreLink = ageVerificationUpsellViewDetailsUrl;
      break;
  }

  if (!isBannerVisible) {
    return null;
  }

  return {
    id: 'age-verification-upsell',
    title: translate(titleTextKey),
    learnMoreLink,
    learnMoreText: translate('Label.AgeVerificationBannerViewDetails'),
    ctaText: translate('Label.AgeVerificationBannerGetStarted'),
    ctaOnClick: () => {
      window.location.href = callToActionUrl;
    },
    dismissible: false,
    trackingParams: { variant },
  };
};

export default useAgeVerificationAlertItem;
