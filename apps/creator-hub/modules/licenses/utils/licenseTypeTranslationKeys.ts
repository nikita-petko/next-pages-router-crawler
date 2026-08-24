import { LicenseType } from '@rbx/client-content-licensing-api/v1';

export type LicenseTypeTranslationKeys = {
  summary: string;
  detail: string;
  tooltip: string;
};

export const LICENSE_TYPE_TRANSLATION_KEYS: Record<LicenseType, LicenseTypeTranslationKeys> = {
  [LicenseType.FullExperience]: {
    summary: 'Label.LicenseTypeFullExperienceLicense',
    detail: 'Label.LicenseTypeFullExperience',
    tooltip: 'Label.TooltipFullExperienceLicense',
  },
  [LicenseType.CollaborationInExperienceSale]: {
    summary: 'Label.LicenseTypeCollaborationLicense',
    detail: 'Label.LicenseTypeCollaboration',
    tooltip: 'Label.TooltipCollaborationLicense',
  },
  [LicenseType.MarketplaceSale]: {
    summary: 'Label.LicenseTypeMarketplaceSaleLicense',
    detail: 'Label.LicenseTypeMarketplaceSale',
    tooltip: 'Label.TooltipMarketplaceSaleLicense',
  },
};

export function getLicenseTypeTranslationKeys(
  licenseType: LicenseType | undefined,
): LicenseTypeTranslationKeys {
  return LICENSE_TYPE_TRANSLATION_KEYS[licenseType ?? LicenseType.FullExperience];
}

/** Falls back to Full Experience when the runtime flag for the API license type is disabled. */
export function getEffectiveLicenseTypeForDisplay(
  licenseType: LicenseType | undefined,
  enableInGameSalesLicensing: boolean,
  enableMarketplaceSalesLicensing: boolean,
): LicenseType {
  if (
    (licenseType === LicenseType.CollaborationInExperienceSale && !enableInGameSalesLicensing) ||
    (licenseType === LicenseType.MarketplaceSale && !enableMarketplaceSalesLicensing)
  ) {
    return LicenseType.FullExperience;
  }
  return licenseType ?? LicenseType.FullExperience;
}
