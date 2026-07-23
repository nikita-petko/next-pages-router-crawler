import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

/**
 * Add these keys to the external `CreatorDashboard.ImmersiveAdsAnalytics` translation source:
 * - `Label.RewardedAdsServingEnabled` — "Serving Enabled"
 * - `Tooltip.RewardedAdsServingEnabled` — tooltip for the serving toggle
 * - `Description.RewardedAdsIneligibleSettingsBanner` — settings tab banner with
 *   `eligibilityTabLinkStart` / `eligibilityTabLinkEnd` tags.
 *
 * Help link (`Label.HowTo`) is shown in the Serving settings accordion subheading (AdServingSettings).
 */
export const RewardedAdsServingEnabledLabelKey = translationKey(
  'Label.RewardedAdsServingEnabled',
  TranslationNamespace.ImmersiveAdsAnalytics,
);

export const RewardedAdsServingEnabledTooltipKey = translationKey(
  'Tooltip.RewardedAdsServingEnabled',
  TranslationNamespace.ImmersiveAdsAnalytics,
);

export const RewardedAdsIneligibleSettingsBannerKey = translationKey(
  'Description.RewardedAdsIneligibleSettingsBanner',
  TranslationNamespace.ImmersiveAdsAnalytics,
);
