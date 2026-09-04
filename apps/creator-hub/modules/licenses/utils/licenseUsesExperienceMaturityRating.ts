import { LicenseType } from '@rbx/client-content-licensing-api/v1';

/**
 * Experience maturity rating applies to Full game and In-game sales licenses.
 * Avatar marketplace licenses have no experience to rate, so mixed surfaces should
 * omit this field instead of showing a value that does not apply.
 */
export function licenseUsesExperienceMaturityRating(licenseType?: LicenseType): boolean {
  return licenseType !== LicenseType.MarketplaceSale;
}
