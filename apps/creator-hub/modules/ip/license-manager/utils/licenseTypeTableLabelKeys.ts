import { LicenseType } from '@rbx/client-content-licensing-api/v1';
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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

export function getLicenseTypeTableLabel(
  licenseType: LicenseType | undefined,
  translate: (key: string) => string,
  tPendingTranslation: TPendingTranslationFunction,
): string {
  if (licenseType === LicenseType.MarketplaceSale) {
    return tPendingTranslation(
      'Marketplace',
      'Shorthand label for "Avatar marketplace license type"',
      translationKey('Label.MarketplaceSale', TranslationNamespace.AgreementsManager),
    );
  }
  return translate(getLicenseTypeTableLabelKey(licenseType));
}
