import { LicenseType } from '@rbx/client-content-licensing-api/v1';

/**
 * Experience licenses target a universe. Avatar Marketplace licenses target a
 * collectible, so list/detail views must not hydrate game details from contentId.
 */
export function licenseUsesUniverseAgreementTarget(licenseType?: LicenseType): boolean {
  return licenseType !== LicenseType.MarketplaceSale;
}
