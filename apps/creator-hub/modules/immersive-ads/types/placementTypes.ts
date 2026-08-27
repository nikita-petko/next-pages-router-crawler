import {
  PlacementRewardStatusEnum,
  PlacementStatusEnum,
  type Placement as ApiPlacement,
  type PlacementReward as ApiPlacementReward,
} from '@rbx/client-developer-ads-stats-api/v1';
export { PlacementStatusEnum as PlacementStatus } from '@rbx/client-developer-ads-stats-api/v1';
export { PlacementRewardStatusEnum } from '@rbx/client-developer-ads-stats-api/v1';

export enum PlacementType {
  Unspecified = 0,
  RewardedVideo = 1,
  PlayWithReward = 2,
}

export const SHOW_MANAGE_TOOLTIP_QUERY_PARAM = 'showManageTooltip';

export interface PlacementReward {
  productId: number;
  name: string;
  imageAssetId?: number;
  status: PlacementRewardStatusEnum;
}

export interface PlacementFrequencyCapSettings {
  frequencyCapLimit?: number;
  frequencyCapWindowMinutes?: number;
}

export interface Placement {
  id: number;
  type: PlacementType;
  name: string;
  universeId: number;
  defaultPlacement: boolean;
  createdTimestampMs: number;
  updatedTimestampMs: number;
  status: PlacementStatusEnum;
  rewards: PlacementReward[];
  excludeLikelyPayers?: boolean;
  frequencyCapSettings?: PlacementFrequencyCapSettings;
}

function normalizeRewards(apiRewards?: ApiPlacementReward[]): PlacementReward[] {
  if (!apiRewards) {
    return [];
  }
  return apiRewards.map((reward) => ({
    productId: reward.productId ?? 0,
    name: reward.rewardHydrationData?.productName ?? '',
    imageAssetId: reward.rewardHydrationData?.imageAssetId,
    status: reward.status ?? PlacementRewardStatusEnum.REWARD_STATUS_UNSPECIFIED,
  }));
}

function normalizePlacementType(type?: number): PlacementType {
  if (type === PlacementType.RewardedVideo || type === PlacementType.PlayWithReward) {
    return type;
  }
  return PlacementType.Unspecified;
}

export function normalizePlacements(apiPlacements: ApiPlacement[]): Placement[] {
  return apiPlacements.map((placement) => ({
    id: placement.id ?? 0,
    type: normalizePlacementType(placement.type),
    name: placement.name ?? '',
    universeId: placement.universeId ?? 0,
    defaultPlacement: placement.defaultPlacement ?? false,
    createdTimestampMs: placement.createdTimestampMs ?? 0,
    updatedTimestampMs: placement.updatedTimestampMs ?? 0,
    status: placement.status ?? PlacementStatusEnum.PLACEMENT_STATUS_UNSPECIFIED,
    rewards: normalizeRewards(placement.rewards),
    excludeLikelyPayers: placement.excludeLikelyPayers,
    frequencyCapSettings: placement.frequencyCapSettings,
  }));
}
