import {
  AgeBracketEnum,
  CreatorEligibilityEnum,
  CreatorTierEnum,
  type CreatorPublishPermissionRequirement,
} from '@rbx/client-core-content-api/v1';
import {
  ageVerificationActionUrl,
  idVerificationActionUrl,
  parentLinkActionUrl,
  phoneVerificationActionUrl,
  twoStepVerificationActionUrl,
} from './tiers';

/**
 * The three creator tiers rendered as columns in the publishing permissions UI. We narrow
 * `CreatorTierEnum` (a string union from the API) to its column-eligible values via `Extract` so
 * we don't define a parallel enum. `Blocked` and any other non-column values are not rendered.
 */
export type PublishingTier = Extract<CreatorTierEnum, 'Private' | 'Trusted' | 'Everyone'>;

export interface RequirementDisplayCopy {
  labelKey: string;
  descriptionKey: string;
  actionUrl?: string;
}

/**
 * Endpoint requirement plus FE-only display copy keys (labels, descriptions, CTAs).
 * Keeps `tierRequirements` from `@rbx/client-core-content-api` instead of remapping to a local record.
 */
export type PublishPermissionRequirement = CreatorPublishPermissionRequirement &
  RequirementDisplayCopy;

/** Requirement row with translation keys already resolved at the page call site. */
export type PublishPermissionRequirementView = CreatorPublishPermissionRequirement & {
  label: string;
  description: string;
  actionUrl?: string;
};

export const VIETNAM_COUNTRY_CODE = 'VN';

export const defaultTierLabelKeys: Record<PublishingTier, string> = {
  [CreatorTierEnum.Private]: 'Label.TierStarter',
  [CreatorTierEnum.Trusted]: 'Label.TierCommunity',
  [CreatorTierEnum.Everyone]: 'Label.TierProfessional',
};

export const defaultTierDescriptionKeys: Record<PublishingTier, string> = {
  [CreatorTierEnum.Private]: 'Description.TierStarter',
  [CreatorTierEnum.Trusted]: 'Description.TierCommunity',
  [CreatorTierEnum.Everyone]: 'Description.TierProfessional',
};

export const vietnamTierLabelKeys: Record<PublishingTier, string> = {
  [CreatorTierEnum.Private]: 'Label.TierVietnamLocal',
  [CreatorTierEnum.Trusted]: 'Label.TierWorldwideTrusted',
  [CreatorTierEnum.Everyone]: 'Label.TierWorldwideAllAges',
};

export const vietnamTierDescriptionKeys: Record<PublishingTier, string> = {
  [CreatorTierEnum.Private]: 'Description.TierContentMaturity',
  [CreatorTierEnum.Trusted]: 'Description.TierContentMaturity',
  [CreatorTierEnum.Everyone]: 'Description.TierContentMaturity',
};

export const approvalBannerKeys: Partial<Record<CreatorTierEnum, string>> = {
  [CreatorTierEnum.Trusted]: 'Message.ApprovedForTrustedFriends',
  [CreatorTierEnum.Everyone]: 'Message.ApprovedForAllAges',
};

export const getRequirementDisplayCopy = (
  id: CreatorEligibilityEnum,
  ageBracket: AgeBracketEnum,
  countryCode: string,
): RequirementDisplayCopy | undefined => {
  // VN-only overrides; unknown ids fall through to the shared matrix below.
  if (countryCode === VIETNAM_COUNTRY_CODE) {
    if (id === CreatorEligibilityEnum.PhoneVerified) {
      return {
        labelKey: 'Label.PhoneVerification',
        descriptionKey: 'Description.PhoneVerification',
        actionUrl: phoneVerificationActionUrl,
      };
    }
    if (id === CreatorEligibilityEnum.IdVerified) {
      return {
        labelKey: 'Label.IdVerification',
        descriptionKey: 'Description.IdVerificationGovtIdOrParental',
        actionUrl: idVerificationActionUrl,
      };
    }
  }

  if (id === CreatorEligibilityEnum.ModerationStatusOk) {
    return {
      labelKey: 'Label.AccountInGoodStanding',
      descriptionKey: 'Description.AccountInGoodStanding',
    };
  }
  if (id === CreatorEligibilityEnum.IdVerified) {
    if (ageBracket === AgeBracketEnum.Under13) {
      return {
        labelKey: 'Label.U13IdVerification',
        descriptionKey: 'Description.U13IdVerification',
        actionUrl: parentLinkActionUrl,
      };
    }
    if (ageBracket === AgeBracketEnum.Between13And18) {
      return {
        labelKey: 'Label.IdVerification',
        descriptionKey: 'Description.B13To18IdVerification',
      };
    }
    return {
      labelKey: 'Label.IdVerification',
      descriptionKey: 'Description.IdVerification',
      actionUrl: idVerificationActionUrl,
    };
  }
  if (id === CreatorEligibilityEnum.AgeEstimationVerified) {
    return {
      labelKey: 'Label.AgeCheck',
      descriptionKey: 'Description.AgeCheck',
      actionUrl: ageVerificationActionUrl,
    };
  }
  if (id === CreatorEligibilityEnum.Has2SvEnabled) {
    return {
      labelKey: 'Label.TwoStepVerification',
      descriptionKey: 'Description.TwoStepVerification',
      actionUrl: twoStepVerificationActionUrl,
    };
  }
  return undefined;
};
