import { CreatorEligibilityEnum, CreatorTierEnum } from '@rbx/client-core-content-api/v1';
import { RequirementStatus, type PublishingTier, type TierRequirement } from '../types';

export const tierOrder: PublishingTier[] = [
  CreatorTierEnum.Private,
  CreatorTierEnum.Trusted,
  CreatorTierEnum.Everyone,
];

export const tierLabelKeys: Record<PublishingTier, string> = {
  [CreatorTierEnum.Private]: 'Label.TierStarter',
  [CreatorTierEnum.Trusted]: 'Label.TierCommunity',
  [CreatorTierEnum.Everyone]: 'Label.TierProfessional',
};

export const tierDescriptionKeys: Record<PublishingTier, string> = {
  [CreatorTierEnum.Private]: 'Description.TierStarter',
  [CreatorTierEnum.Trusted]: 'Description.TierCommunity',
  [CreatorTierEnum.Everyone]: 'Description.TierProfessional',
};

export const idVerificationActionUrl = `https://${process.env.robloxSiteDomain}/my/account?idVerification#!/info`;
export const parentLinkActionUrl = `https://${process.env.robloxSiteDomain}/my/account?addParent#!/parental-controls`;

export const requirements: TierRequirement[] = [
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
    id: CreatorEligibilityEnum.IdVerified,
    labelKey: 'Label.IdVerification',
    descriptionKey: 'Description.IdVerification',
    actionUrl: idVerificationActionUrl,
    tiers: {
      [CreatorTierEnum.Private]: RequirementStatus.NotRequired,
      [CreatorTierEnum.Trusted]: RequirementStatus.NotRequired,
      [CreatorTierEnum.Everyone]: RequirementStatus.Required,
    },
  },
  {
    id: CreatorEligibilityEnum.AgeEstimationVerified,
    labelKey: 'Label.AgeCheck',
    descriptionKey: 'Description.AgeCheck',
    actionUrl: `https://${process.env.robloxSiteDomain}/my/account?ageVerification#!/info`,
    tiers: {
      [CreatorTierEnum.Private]: RequirementStatus.NotRequired,
      [CreatorTierEnum.Trusted]: RequirementStatus.Required,
      [CreatorTierEnum.Everyone]: RequirementStatus.Required,
    },
  },
  {
    id: CreatorEligibilityEnum.Has2SvEnabled,
    labelKey: 'Label.TwoStepVerification',
    descriptionKey: 'Description.TwoStepVerification',
    actionUrl: `https://${process.env.robloxSiteDomain}/my/account#!/security`,
    tiers: {
      [CreatorTierEnum.Private]: RequirementStatus.NotRequired,
      [CreatorTierEnum.Trusted]: RequirementStatus.NotRequired,
      [CreatorTierEnum.Everyone]: RequirementStatus.Required,
    },
  },
];

export const U13IdRequirement: TierRequirement = {
  id: CreatorEligibilityEnum.IdVerified,
  labelKey: 'Label.U13IdVerification',
  descriptionKey: 'Description.U13IdVerification',
  actionUrl: parentLinkActionUrl,
  tiers: {
    [CreatorTierEnum.Private]: RequirementStatus.NotRequired,
    [CreatorTierEnum.Trusted]: RequirementStatus.NotRequired,
    [CreatorTierEnum.Everyone]: RequirementStatus.Required,
  },
};

export const B13To18IdRequirement: TierRequirement = {
  id: CreatorEligibilityEnum.IdVerified,
  labelKey: 'Label.IdVerification',
  descriptionKey: 'Description.B13To18IdVerification',
  tiers: {
    [CreatorTierEnum.Private]: RequirementStatus.NotRequired,
    [CreatorTierEnum.Trusted]: RequirementStatus.NotRequired,
    [CreatorTierEnum.Everyone]: RequirementStatus.Required,
  },
};
