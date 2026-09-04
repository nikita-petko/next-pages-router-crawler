import { LicenseType } from '@rbx/client-content-licensing-api/v1';
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

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

export function getLicenseTypeTooltipText(
  licenseType: LicenseType,
  translate: (key: string) => string,
  tPendingTranslation: TPendingTranslationFunction,
): string {
  if (licenseType === LicenseType.FullExperience) {
    return tPendingTranslation(
      'A full game license allows creators to use the IP in a way that’s central to the game.',
      'Tooltip explaining what a full experience license means',
      translationKey('Label.TooltipFullExperienceLicense', TranslationNamespace.Licenses),
    );
  }
  if (licenseType === LicenseType.CollaborationInExperienceSale) {
    return tPendingTranslation(
      'An in-game sales license allows creators to sell IP-based items within a game via designated sales products.',
      'Tooltip explaining what a In-game sales license means',
      translationKey('Label.TooltipCollaborationLicense', TranslationNamespace.Licenses),
    );
  }
  return translate(getLicenseTypeTranslationKeys(licenseType).tooltip);
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
