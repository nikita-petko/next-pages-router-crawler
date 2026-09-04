import {
  CreatorEarningsBucket,
  LicenseType,
  type LicenseResponse,
} from '@rbx/client-content-licensing-api/v1';
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export type CreatorEarningsRequirementText = {
  label: string;
  tooltip: string;
  value: string;
};

function getCreatorEarningsBucketText(
  license: LicenseResponse,
  translate: (key: string) => string,
  tPendingTranslation: TPendingTranslationFunction,
) {
  switch (license.licenseTerms?.minimumCreatorEarningsBucket) {
    case CreatorEarningsBucket.NotApplicable:
      return tPendingTranslation(
        'No requirement',
        'No earning requirement',
        translationKey('Label.CreatorEarningsNoRange', TranslationNamespace.Licenses),
      );
    case CreatorEarningsBucket.Small:
      return tPendingTranslation(
        'Greater than 1,000 Robux',
        'Greater than 1,000 Robux',
        translationKey('Label.CreatorEarningsSmallRange', TranslationNamespace.Licenses),
      );

    case CreatorEarningsBucket.Medium:
      return tPendingTranslation(
        'Greater than 10,000 Robux',
        'Greater than 10,000 Robux',
        translationKey('Label.CreatorEarningsMediumRange', TranslationNamespace.Licenses),
      );

    case CreatorEarningsBucket.Large:
      return tPendingTranslation(
        'Greater than 100,000 Robux',
        'Greater than 100,000 Robux',
        translationKey('Label.CreatorEarningsLargeRange', TranslationNamespace.Licenses),
      );

    case CreatorEarningsBucket.VeryLarge:
      return tPendingTranslation(
        'Greater than 1,000,000 Robux',
        'Greater than 1,000,000 Robux',
        translationKey('Label.CreatorEarningsVeryLargeRange', TranslationNamespace.Licenses),
      );

    case CreatorEarningsBucket.Invalid:
    case undefined:
    default:
      return translate('Label.NotApplicable');
  }
}

/**
 * Returns `undefined` for every license type except Avatar Marketplace, which is the only type that
 * carries a minimum 90 day creator earnings requirement. Callers pass the effective license type so
 * a Marketplace license that falls back to Full Experience display does not surface the
 * Marketplace-only requirement.
 */
export function getCreatorEarningsRequirementText(
  license: LicenseResponse,
  effectiveLicenseType: LicenseType,
  translate: (key: string) => string,
  tPendingTranslation: TPendingTranslationFunction,
): CreatorEarningsRequirementText | undefined {
  if (effectiveLicenseType !== LicenseType.MarketplaceSale) {
    return undefined;
  }

  return {
    label: tPendingTranslation(
      'Minimum creator 90 day earnings',
      'Label for the minimum 90 day earnings requirement for a creator applying for an avatar marketplace license',
      translationKey('Label.NinetyDayEarnings', TranslationNamespace.Licenses),
    ),
    tooltip: tPendingTranslation(
      'Avatar Marketplace creator earnings from the previous 90 days, for your Roblox user identity or a group you own.',
      'Tooltip explaining that the required earnings bucket uses 90-day Avatar Marketplace earnings for the applying user or an owned group.',
      translationKey('Tooltip.CreatorEarningsRequirement', TranslationNamespace.Licenses),
    ),
    value: getCreatorEarningsBucketText(license, translate, tPendingTranslation),
  };
}
