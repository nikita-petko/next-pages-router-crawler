import {
  AgeBracketEnum,
  CreatorEligibilityEnum,
  CreatorTierEnum,
} from '@rbx/client-core-content-api/v1';
import { RequirementStatus, type PublishingTier, type TierRequirement } from '../types';
import {
  B13To18IdRequirement,
  U13IdRequirement,
  requirements as defaultRequirements,
  tierDescriptionKeys as defaultTierDescriptionKeys,
  tierLabelKeys as defaultTierLabelKeys,
  tierOrder as defaultTierOrder,
} from './tiers';

export interface PublishingPermissionsConfig {
  tierOrder: PublishingTier[];
  tierLabelKeys: Record<PublishingTier, string>;
  tierDescriptionKeys: Record<PublishingTier, string>;
  getRequirements: (ageBracket: AgeBracketEnum) => TierRequirement[];
  /**
   * Approval banner translation keys, indexed by the user's `creatorTier`. Banner is shown when
   * `allowlistTier` includes `creatorTier` AND a key is registered for that tier.
   */
  approvalBannerKeys?: Partial<Record<CreatorTierEnum, string>>;
}

/**
 * Returns the publishing tier (column) to highlight as "current" for the given creatorTier.
 * `Private` / `Trusted` / `Everyone` are passed through; anything else (e.g. `Blocked`) falls
 * back to `Private`.
 */
export const getCurrentPublishingTier = (creatorTier: CreatorTierEnum): PublishingTier => {
  if (creatorTier === CreatorTierEnum.Trusted || creatorTier === CreatorTierEnum.Everyone) {
    return creatorTier;
  }
  return CreatorTierEnum.Private;
};

const getDefaultRequirements = (ageBracket: AgeBracketEnum): TierRequirement[] => {
  if (ageBracket === AgeBracketEnum.Under13) {
    return defaultRequirements.toSpliced(1, 1, U13IdRequirement);
  }
  if (ageBracket === AgeBracketEnum.Between13And18) {
    return defaultRequirements.toSpliced(1, 1, B13To18IdRequirement);
  }
  return defaultRequirements;
};

const defaultApprovalBannerKeys: Partial<Record<CreatorTierEnum, string>> = {
  [CreatorTierEnum.Trusted]: 'Message.ApprovedForTrustedFriends',
  [CreatorTierEnum.Everyone]: 'Message.ApprovedForAllAges',
};

export const defaultPublishingPermissionsConfig: PublishingPermissionsConfig = {
  tierOrder: defaultTierOrder,
  tierLabelKeys: defaultTierLabelKeys,
  tierDescriptionKeys: defaultTierDescriptionKeys,
  getRequirements: getDefaultRequirements,
  approvalBannerKeys: defaultApprovalBannerKeys,
};

// --- Vietnam-specific config ---

const vietnamTierLabelKeys: Record<PublishingTier, string> = {
  [CreatorTierEnum.Private]: 'Label.TierVietnamLocal',
  [CreatorTierEnum.Trusted]: 'Label.TierWorldwideTrusted',
  [CreatorTierEnum.Everyone]: 'Label.TierWorldwideAllAges',
};

const vietnamTierDescriptionKeys: Record<PublishingTier, string> = {
  [CreatorTierEnum.Private]: 'Description.TierContentMaturity',
  [CreatorTierEnum.Trusted]: 'Description.TierContentMaturity',
  [CreatorTierEnum.Everyone]: 'Description.TierContentMaturity',
};

const vietnamRequirements: TierRequirement[] = [
  {
    id: CreatorEligibilityEnum.ModerationStatusOk,
    labelKey: 'Label.AccountInGoodStanding',
    descriptionKey: 'Description.AccountInGoodStanding',
    tiers: {
      [CreatorTierEnum.Private]: RequirementStatus.Required,
      [CreatorTierEnum.Trusted]: RequirementStatus.Required,
      [CreatorTierEnum.Everyone]: RequirementStatus.Required,
    },
  },
  {
    id: CreatorEligibilityEnum.PhoneVerified,
    labelKey: 'Label.PhoneVerification',
    descriptionKey: 'Description.PhoneVerification',
    comingSoon: true,
    tiers: {
      [CreatorTierEnum.Private]: RequirementStatus.NotRequired,
      [CreatorTierEnum.Trusted]: RequirementStatus.Required,
      [CreatorTierEnum.Everyone]: RequirementStatus.Required,
    },
  },
  {
    id: CreatorEligibilityEnum.IdVerified,
    labelKey: 'Label.IdVerification',
    descriptionKey: 'Description.IdVerificationGovtIdOrParental',
    comingSoon: true,
    tiers: {
      [CreatorTierEnum.Private]: RequirementStatus.NotRequired,
      [CreatorTierEnum.Trusted]: RequirementStatus.NotRequired,
      [CreatorTierEnum.Everyone]: RequirementStatus.Required,
    },
  },
];

export const vietnamPublishingPermissionsConfig: PublishingPermissionsConfig = {
  tierOrder: defaultTierOrder,
  tierLabelKeys: vietnamTierLabelKeys,
  tierDescriptionKeys: vietnamTierDescriptionKeys,
  getRequirements: () => vietnamRequirements,
  approvalBannerKeys: defaultApprovalBannerKeys,
};

// --- Registry ---

export const VIETNAM_COUNTRY_CODE = 'VN';

const publishingPermissionsConfigByCountryCode: Record<string, PublishingPermissionsConfig> = {
  [VIETNAM_COUNTRY_CODE]: vietnamPublishingPermissionsConfig,
};

export const getPublishingPermissionsConfig = (
  countryCode: string | undefined,
): PublishingPermissionsConfig => {
  if (!countryCode) {
    return defaultPublishingPermissionsConfig;
  }
  return (
    publishingPermissionsConfigByCountryCode[countryCode] ?? defaultPublishingPermissionsConfig
  );
};
