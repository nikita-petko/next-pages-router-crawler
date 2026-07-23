import React, { useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import UnifiedAlertBanner from '@modules/unified-alerts/components/UnifiedAlertBanner';
import { useAgeVerificationAlertItem } from '@modules/age-verification-upsell/hooks/useAgeVerificationAlertItem';
import { useUnratedExperienceAlertItem } from '../hooks/useUnratedExperienceAlertItem';

/**
 * HomeUnifiedAlertBanner aggregates all home page alerts and renders them
 * using the UnifiedAlertBanner component.
 *
 * This component uses shared alert hooks to ensure consistency between
 * the unified alert system and individual banner components.
 */
const HomeUnifiedAlertBannerComponent: React.FC = () => {
  const ageVerificationAlert = useAgeVerificationAlertItem();
  const unratedOrActivationAlert = useUnratedExperienceAlertItem();

  const alerts = useMemo(
    () => [ageVerificationAlert, unratedOrActivationAlert].filter((alert) => alert !== null),
    [ageVerificationAlert, unratedOrActivationAlert],
  );

  return <UnifiedAlertBanner alerts={alerts} trackingPage='home' />;
};

export const HomeUnifiedAlertBanner = withTranslation(HomeUnifiedAlertBannerComponent, [
  TranslationNamespace.Home,
  TranslationNamespace.PublicPublish,
]);

export default HomeUnifiedAlertBanner;
