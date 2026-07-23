import { LicenseType } from '@rbx/client-content-licensing-api/v1';

/** Column header translation key shared by license and agreement tables. */
export const LICENSE_TYPE_TABLE_HEADER_KEY = 'Label.LicenseType';

/** Short license-type labels for compact table cells (listings and agreements). */
export const LICENSE_TYPE_TABLE_LABEL_KEYS: Record<LicenseType, string> = {
  [LicenseType.FullExperience]: 'Label.FullExperience',
  [LicenseType.CollaborationInExperienceSale]: 'Label.Collaboration',
  [LicenseType.MarketplaceSale]: 'Label.MarketplaceSale',
};

export function getLicenseTypeTableLabelKey(licenseType: LicenseType | undefined): string {
  return LICENSE_TYPE_TABLE_LABEL_KEYS[licenseType ?? LicenseType.FullExperience];
}
