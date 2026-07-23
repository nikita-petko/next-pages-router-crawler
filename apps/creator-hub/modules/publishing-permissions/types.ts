import type { CreatorEligibilityEnum, CreatorTierEnum } from '@rbx/client-core-content-api/v1';

/**
 * The three creator tiers rendered as columns in the publishing permissions UI. We narrow
 * `CreatorTierEnum` (a string union from the API) to its column-eligible values via `Extract` so
 * we don't define a parallel enum. `Blocked` and any other future `CreatorTierEnum` values are
 * handled by `getCurrentPublishingTier` (defaulting to `Private`) rather than rendered as columns.
 */
export type PublishingTier = Extract<CreatorTierEnum, 'Private' | 'Trusted' | 'Everyone'>;

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
