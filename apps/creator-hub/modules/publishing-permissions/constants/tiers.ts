import { CreatorEligibilityEnum } from '@rbx/clients/coreContentApi';
import { PublishingTier, RequirementStatus, type TierRequirement } from '../types';

export const tierOrder: PublishingTier[] = [
  PublishingTier.Starter,
  PublishingTier.Community,
  PublishingTier.Professional,
];

export const tierLabelKeys: Record<PublishingTier, string> = {
  [PublishingTier.Starter]: 'Label.TierStarter',
  [PublishingTier.Community]: 'Label.TierCommunity',
  [PublishingTier.Professional]: 'Label.TierProfessional',
};

export const tierDescriptionKeys: Partial<Record<PublishingTier, string>> = {
  [PublishingTier.Starter]: 'Description.TierStarter',
  [PublishingTier.Community]: 'Description.TierCommunity',
  [PublishingTier.Professional]: 'Description.TierProfessional',
};

export const requirements: TierRequirement[] = [
  {
    id: CreatorEligibilityEnum.ModerationStatusOk,
    labelKey: 'Label.AccountInGoodStanding',
    descriptionKey: 'Description.AccountInGoodStanding',
    tiers: {
      [PublishingTier.Starter]: RequirementStatus.Required,
      [PublishingTier.Community]: RequirementStatus.Required,
      [PublishingTier.Professional]: RequirementStatus.Required,
    },
  },
  {
    id: CreatorEligibilityEnum.IdVerified,
    labelKey: 'Label.IdVerification',
    descriptionKey: 'Description.IdVerification',
    actionUrl: `https://${process.env.robloxSiteDomain}/my/account?idVerification#!/info`,
    tiers: {
      [PublishingTier.Starter]: RequirementStatus.NotRequired,
      [PublishingTier.Community]: RequirementStatus.NotRequired,
      [PublishingTier.Professional]: RequirementStatus.Required,
    },
  },
  {
    id: CreatorEligibilityEnum.AgeEstimationVerified,
    labelKey: 'Label.AgeCheck',
    descriptionKey: 'Description.AgeCheck',
    actionUrl: `https://${process.env.robloxSiteDomain}/my/account?ageVerification#!/info`,
    tiers: {
      [PublishingTier.Starter]: RequirementStatus.NotRequired,
      [PublishingTier.Community]: RequirementStatus.Required,
      [PublishingTier.Professional]: RequirementStatus.Required,
    },
  },
  {
    id: CreatorEligibilityEnum.Has2SvEnabled,
    labelKey: 'Label.TwoStepVerification',
    descriptionKey: 'Description.TwoStepVerification',
    actionUrl: `https://${process.env.robloxSiteDomain}/my/account#!/security`,
    tiers: {
      [PublishingTier.Starter]: RequirementStatus.NotRequired,
      [PublishingTier.Community]: RequirementStatus.NotRequired,
      [PublishingTier.Professional]: RequirementStatus.Required,
    },
  },
  {
    id: CreatorEligibilityEnum.HasRobloxPremium,
    labelKey: 'Label.PremiumSubscription',
    descriptionKey: 'Description.PremiumSubscription',
    comingSoon: true,
    tiers: {
      [PublishingTier.Starter]: RequirementStatus.NotRequired,
      [PublishingTier.Community]: RequirementStatus.NotRequired,
      [PublishingTier.Professional]: RequirementStatus.Required,
    },
  },
];
