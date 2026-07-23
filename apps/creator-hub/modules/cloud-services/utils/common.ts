import type { TGroup, TUser } from '@modules/authentication/types';
import { CreatorType } from '@modules/miscellaneous/common';
import type { UnlockEligibilities, EligibilityRequirementResult } from '../pricing/types';
import { EligibilityRequirement } from '../pricing/types';

export function getAccountSettingsUrl(
  userIdOverride?: string,
  groupIdOverride?: string,
  creatorType?: CreatorType,
  creatorId?: number,
): string {
  const baseUrl = '/dashboard/account-information';
  const params = new URLSearchParams();

  if (userIdOverride) {
    params.append('userIdOverride', userIdOverride);
  }

  if (groupIdOverride) {
    params.append('groupIdOverride', groupIdOverride);
  }

  // If the CreatorType is group, then append the groupId.
  if (creatorType === CreatorType.Group && creatorId) {
    params.append('groupId', creatorId.toString());
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Payment methods are shared between user and group accounts so there is no group id needed.
export function getPaymentUrl(userIdOverride?: string): string {
  return userIdOverride
    ? `/dashboard/payments?userIdOverride=${userIdOverride}`
    : '/dashboard/payments';
}

export function parseOverrideId(overrideId?: string | string[]): number | undefined {
  if (!overrideId) {
    return undefined;
  }

  return Array.isArray(overrideId) ? parseInt(overrideId[0], 10) : parseInt(overrideId, 10);
}

export function getActivitiesUrl(
  userIdOverride?: string,
  groupIdOverride?: string,
  creatorType?: CreatorType,
  creatorId?: number,
): string {
  const baseUrl = '/dashboard/billing';
  const params = new URLSearchParams();

  if (userIdOverride) {
    params.append('userIdOverride', userIdOverride);
  }

  if (groupIdOverride) {
    params.append('groupIdOverride', groupIdOverride);
  }

  // If the CreatorType is group, then append the groupId.
  if (creatorType === CreatorType.Group && creatorId) {
    params.append('groupId', creatorId.toString());
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export function getCreatorTypeAndId(
  currentGroup: TGroup | null,
  user: TUser | null,
): { creatorType: CreatorType; creatorId: number; userId: number } {
  if (currentGroup && currentGroup.id && user && user.id) {
    return { creatorType: CreatorType.Group, creatorId: currentGroup.id, userId: user.id };
  }
  if (currentGroup === null && user && user.id) {
    return { creatorType: CreatorType.User, creatorId: user.id, userId: user.id };
  }

  throw new Error('Invalid input: currentGroup and user must be provided with valid ids');
}

export function isValidBillingDateString(dateString: string): boolean {
  const currentDate = new Date(Date.now());
  const inputDate = new Date(dateString);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
    !Number.isNaN(inputDate.getTime()) &&
    inputDate <= currentDate
  );
}

export function parseEligibilities(
  requirements: EligibilityRequirementResult[],
): UnlockEligibilities {
  // Initialize the eligibilities as false
  const eligibilities: UnlockEligibilities = {
    generalEligibility: false,
    premiumEligibility: false,
  };

  // Flags to check if all requirements are met
  let allGeneralEligible = true;
  let allPremiumEligible = true;

  // Iterate over the requirements and update the flags
  requirements.forEach((requirement) => {
    if (
      requirement.eligibilityRequirement === EligibilityRequirement.Premium &&
      !requirement.eligible
    ) {
      allPremiumEligible = false;
    } else if (
      requirement.eligibilityRequirement === EligibilityRequirement.IdVerified &&
      !requirement.eligible &&
      process.env.targetEnvironment === 'production'
    ) {
      allGeneralEligible = false;
    } else if (
      !requirement.eligible &&
      requirement.eligibilityRequirement !== EligibilityRequirement.Premium &&
      requirement.eligibilityRequirement !== EligibilityRequirement.IdVerified
    ) {
      allGeneralEligible = false;
    }
  });

  // Set eligibilities to true if all requirements are met
  if (allGeneralEligible) {
    eligibilities.generalEligibility = true;
  }
  if (allPremiumEligible) {
    eligibilities.premiumEligibility = true;
  }

  return eligibilities;
}
