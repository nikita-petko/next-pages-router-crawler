import { GetSitetestBaseUrl } from '@utils/url';

export const AdIntegrationsDocsUrl =
  'https://create.roblox.com/docs/production/promotion/ad-integrations';

// Deep-links to the revenue-share section of the ad integrations docs. Used by
// the revenue share forecaster tile.
export const AdIntegrationRevenueShareDocsUrl =
  'https://create.roblox.com/docs/production/promotion/ad-integrations#revenue-share';

/** Creator Dashboard immersive-ads eligibility tab for a specific experience. */
export const getAdIntegrationEligibilityUrl = (universeId: number): string =>
  `https://create.${GetSitetestBaseUrl()}/dashboard/creations/experiences/${String(universeId)}/monetization/immersive-ads?tab=Eligibility`;
