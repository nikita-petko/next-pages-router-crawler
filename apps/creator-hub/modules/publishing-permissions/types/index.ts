import type { CreatorEligibilityEnum } from '@rbx/clients/coreContentApi';

export enum PublishingTier {
  Starter,
  Community,
  Professional,
}

export enum RequirementStatus {
  Done,
  Required,
  NotRequired,
}

export interface TierRequirement {
  id: CreatorEligibilityEnum;
  labelKey: string;
  descriptionKey: string;
  actionUrl?: string;
  comingSoon?: boolean;
  tiers: Record<PublishingTier, RequirementStatus>;
}
