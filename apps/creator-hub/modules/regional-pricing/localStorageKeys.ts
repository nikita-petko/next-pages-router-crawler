/** Local storage for whether user has seen the game pass primary disclaimer modal for regional pricing */
export const hasAcceptedRegionalPricingDisclaimerKey = (universeId: number) =>
  `hasAcceptedRegionalPricingDisclaimer.${universeId}` as const;

/** Global key for whether user has seen the first-time disclaimer modal for developer product regional pricing */
export const hasAcceptedDevProductRegionalPricingDisclaimerKey = (universeId: number) =>
  `hasAcceptedDevProductRegionalPricingDisclaimer.${universeId}` as const;

/** Global key for whether user has seen the reacknowledgement modal for developer product gifting trading */
export const hasAcceptedGiftingTradingWarningDisclaimerKey = (universeId: number) =>
  `hasAcceptedGiftingTradingWarningDisclaimerKey.${universeId}` as const;

/** Global key for when the gifting trading warning banner was last dismissed */
export const lastDismissedGiftingTradingWarningBannerKey = (universeId: number) =>
  `lastDismissedGiftingTradingWarningBanner.${universeId}` as const;

/** Local storage for when the promotion banner was last closed */
export const lastClosedRegionalPricingPromotionBannerKey = (universeId: number, userId?: number) =>
  `lastClosedRegionalPricingPromotionBanner.${universeId}.${userId}`;

/** Local storage for when the game passes promotion banner was last closed */
export const lastClosedGamePassesPromotionBannerKey = (universeId: number, userId?: number) =>
  `lastClosedGamePassesPromotionBanner.${universeId}.${userId}`;

/** Local storage for when the developer products promotion banner was last closed */
export const lastClosedDeveloperProductsPromotionBannerKey = (
  universeId: number,
  userId?: number,
) => `lastClosedDeveloperProductsPromotionBanner.${universeId}.${userId}`;
