import type { LicenseDurationResponse } from '@rbx/client-content-licensing-api/v1';
import { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';
import { isAvatarLicenseApplyFlow } from './isAvatarLicenseApplyFlow';
import { getIsNonZeroRevShareFromValue } from './revShare';

export enum RevShareTiming {
  Now = 'rev-share-now',
  Later = 'rev-share-later',
  NoPreference = 'no-preference',
}

const REV_SHARE_TIMING_FROM_RADIO_VALUE: Record<string, RevShareTiming> = {
  [RevShareTiming.Now]: RevShareTiming.Now,
  [RevShareTiming.Later]: RevShareTiming.Later,
  [RevShareTiming.NoPreference]: RevShareTiming.NoPreference,
};

export function revShareTimingFromRadioValue(value: string): RevShareTiming | undefined {
  return REV_SHARE_TIMING_FROM_RADIO_VALUE[value];
}

export function getRevShareTimingPreference(
  revShareValue: number | undefined,
  licenseRevShareTiming: boolean | undefined,
  userPreference?: boolean,
): RevShareTiming | undefined {
  if (typeof userPreference === 'boolean') {
    return userPreference ? RevShareTiming.Now : RevShareTiming.Later;
  }

  if (getIsNonZeroRevShareFromValue(revShareValue)) {
    return licenseRevShareTiming ? RevShareTiming.Now : RevShareTiming.Later;
  }

  return RevShareTiming.NoPreference;
}

export function isRevShareNowTimingPreferred(
  revShareOnActivation: boolean,
  revShareTiming: RevShareTiming | undefined,
): boolean {
  if (revShareOnActivation) {
    return true;
  }

  return revShareTiming === RevShareTiming.Now;
}

export function shouldShowRevSharePreferenceRadio(
  revShareOnActivation: boolean,
  durationType?: LicenseDurationType,
  licenseType?: LicenseType,
): boolean {
  if (isAvatarLicenseApplyFlow(licenseType)) {
    return false;
  }
  return !revShareOnActivation && durationType === LicenseDurationType.Perpetual;
}

/** True when a non-zero rev-share license still needs an explicit Now/Later choice. */
export function isRevSharePreferenceSelectionIncomplete({
  revShareValue,
  revShareOnActivation,
  durationType,
  revShareTiming,
  licenseType,
}: {
  revShareValue?: number;
  revShareOnActivation: boolean;
  durationType?: LicenseDurationType;
  revShareTiming?: RevShareTiming;
  licenseType?: LicenseType;
}): boolean {
  return (
    shouldShowRevSharePreferenceRadio(revShareOnActivation, durationType, licenseType) &&
    getIsNonZeroRevShareFromValue(revShareValue) &&
    (revShareTiming === undefined || revShareTiming === RevShareTiming.NoPreference)
  );
}

export type RevShareOnActivationDescriptionKey =
  | 'Description.TimeLimitedLicenseZeroRevShare'
  | 'Description.CollaborationTimeLimitedRevShareTimingWithValue'
  | 'Description.TimeLimitedRevShareTimingWithValue'
  | 'Description.CollaborationRevShareTimingWithValue'
  | 'Description.MarketplaceSalesRevenueShareTiming'
  | 'Description.AvatarRevShareTimingWithValue'
  | 'Description.AvatarTimeLimitedRevShareWithValue';

/** Translation keys for fixed rev-share-on-activation copy in the apply flow, in render order. */
export function getRevShareOnActivationDescriptionKeys({
  revShareValue,
  licenseDuration,
  licenseType,
  enableCollaborationLicensing,
}: {
  revShareValue?: number;
  licenseDuration?: LicenseDurationResponse;
  licenseType?: LicenseType;
  enableCollaborationLicensing: boolean;
}): RevShareOnActivationDescriptionKey[] {
  if (!getIsNonZeroRevShareFromValue(revShareValue)) {
    return ['Description.TimeLimitedLicenseZeroRevShare'];
  }

  const isAvatarLicense = isAvatarLicenseApplyFlow(licenseType);
  const isTimeLimited = licenseDuration?.durationType === LicenseDurationType.TimeLimited;
  const isInExperienceSales =
    enableCollaborationLicensing && licenseType === LicenseType.CollaborationInExperienceSale;

  if (isAvatarLicense) {
    if (isTimeLimited) {
      return [
        'Description.MarketplaceSalesRevenueShareTiming',
        'Description.AvatarTimeLimitedRevShareWithValue',
      ];
    }
    return [
      'Description.MarketplaceSalesRevenueShareTiming',
      'Description.AvatarRevShareTimingWithValue',
    ];
  }

  if (isInExperienceSales) {
    if (isTimeLimited) {
      return ['Description.CollaborationTimeLimitedRevShareTimingWithValue'];
    }
    return ['Description.CollaborationRevShareTimingWithValue'];
  }

  if (isTimeLimited) {
    return ['Description.TimeLimitedRevShareTimingWithValue'];
  }
  return ['Description.TimeLimitedRevShareTimingWithValue'];
}
