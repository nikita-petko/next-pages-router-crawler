import { LicenseType } from '@rbx/client-content-licensing-api/v1';

/** Marketplace sale licenses apply to avatar marketplace creations and skip experience selection. */
export function isAvatarLicenseApplyFlow(licenseType?: LicenseType): boolean {
  return licenseType === LicenseType.MarketplaceSale;
}
