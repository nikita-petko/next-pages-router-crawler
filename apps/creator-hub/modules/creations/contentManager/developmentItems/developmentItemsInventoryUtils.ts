import {
  AssetType as CreatorInventoryApiAssetType,
  State as CreatorInventoryApiState,
} from '@rbx/client-creator-inventory-api/v1';
import type {
  AssetType as CreatorInventoryApiAssetTypeValue,
  SearchCreatorInventoryItemsFilter,
} from '@rbx/client-creator-inventory-api/v1';
import type {
  CreatorInventoryItem,
  CreatorInventoryScope,
  CreatorInventorySource,
} from '@modules/clients/creatorInventory';
import {
  CreatorInventoryAssetType,
  CreatorInventoryScopeType,
  CreatorInventorySourceType,
} from '@modules/clients/creatorInventory';
import { Asset } from '@modules/miscellaneous/common';

export enum DevelopmentItemsSourceFilter {
  All = 'All',
}

// TODO: Add archive, sharing, and sorting when the Inventory API's new search index supports them.

export type DevelopmentItemsAssetTypeSelection = CreatorInventoryAssetType;

export type DevelopmentItemsInventorySource = Exclude<
  CreatorInventorySourceType,
  typeof CreatorInventorySourceType.Invalid
>;

export type DevelopmentItemsSourceSelection =
  | DevelopmentItemsSourceFilter
  | DevelopmentItemsInventorySource;

export type DevelopmentItemsView = 'grid' | 'list';

export type DevelopmentItemsInventoryItem = {
  id: string;
  assetId: number;
  assetType?: CreatorInventoryAssetType;
  created?: Date;
  isPackage: boolean;
  name: string;
  sources: DevelopmentItemsInventorySource[];
  state?: 'Active' | 'Archived';
  updated?: Date;
};

export const developmentItemsAssetTypes = [
  CreatorInventoryAssetType.Model,
  CreatorInventoryAssetType.Plugin,
  CreatorInventoryAssetType.Audio,
  CreatorInventoryAssetType.Decal,
  CreatorInventoryAssetType.Image,
  CreatorInventoryAssetType.Video,
  CreatorInventoryAssetType.Mesh,
  CreatorInventoryAssetType.MeshPart,
  CreatorInventoryAssetType.Animation,
] as const;

const developmentItemsAssetTypeSet = new Set<string>(developmentItemsAssetTypes);
const developmentItemsSourceSet = new Set<string>([
  DevelopmentItemsSourceFilter.All,
  CreatorInventorySourceType.Created,
  CreatorInventorySourceType.Purchased,
  CreatorInventorySourceType.Shared,
]);

const developmentItemAssets = new Set<Asset>([
  Asset.Animation,
  Asset.Audio,
  Asset.Decal,
  Asset.Image,
  Asset.Mesh,
  Asset.MeshPart,
  Asset.Model,
  Asset.Plugin,
  Asset.Video,
]);

const assetTypeToApiAssetType: Record<
  CreatorInventoryAssetType,
  CreatorInventoryApiAssetTypeValue
> = {
  [CreatorInventoryAssetType.Animation]: CreatorInventoryApiAssetType.Animation,
  [CreatorInventoryAssetType.Audio]: CreatorInventoryApiAssetType.Audio,
  [CreatorInventoryAssetType.Decal]: CreatorInventoryApiAssetType.Decal,
  [CreatorInventoryAssetType.Image]: CreatorInventoryApiAssetType.Image,
  [CreatorInventoryAssetType.Mesh]: CreatorInventoryApiAssetType.Mesh,
  [CreatorInventoryAssetType.MeshPart]: CreatorInventoryApiAssetType.MeshPart,
  [CreatorInventoryAssetType.Model]: CreatorInventoryApiAssetType.Model,
  [CreatorInventoryAssetType.Plugin]: CreatorInventoryApiAssetType.Plugin,
  [CreatorInventoryAssetType.Video]: CreatorInventoryApiAssetType.Video,
};

const normalizedAssetTypes: Record<string, CreatorInventoryAssetType> = {
  '3': CreatorInventoryAssetType.Audio,
  '10': CreatorInventoryAssetType.Model,
  '13': CreatorInventoryAssetType.Decal,
  '24': CreatorInventoryAssetType.Animation,
  '38': CreatorInventoryAssetType.Plugin,
  '40': CreatorInventoryAssetType.MeshPart,
  '62': CreatorInventoryAssetType.Video,
  ANIMATION: CreatorInventoryAssetType.Animation,
  ASSET_TYPE_ANIMATION: CreatorInventoryAssetType.Animation,
  ASSET_TYPE_AUDIO: CreatorInventoryAssetType.Audio,
  ASSET_TYPE_DECAL: CreatorInventoryAssetType.Decal,
  ASSET_TYPE_IMAGE: CreatorInventoryAssetType.Image,
  ASSET_TYPE_MESH: CreatorInventoryAssetType.Mesh,
  ASSET_TYPE_MESH_PART: CreatorInventoryAssetType.MeshPart,
  ASSET_TYPE_MODEL: CreatorInventoryAssetType.Model,
  ASSET_TYPE_PLUGIN: CreatorInventoryAssetType.Plugin,
  ASSET_TYPE_VIDEO: CreatorInventoryAssetType.Video,
  AUDIO: CreatorInventoryAssetType.Audio,
  DECAL: CreatorInventoryAssetType.Decal,
  IMAGE: CreatorInventoryAssetType.Image,
  MESH: CreatorInventoryAssetType.Mesh,
  MESHPART: CreatorInventoryAssetType.MeshPart,
  MODEL: CreatorInventoryAssetType.Model,
  PLUGIN: CreatorInventoryAssetType.Plugin,
  VIDEO: CreatorInventoryAssetType.Video,
};

const sourceDetailsToSourceType: Record<string, DevelopmentItemsInventorySource> = {
  createdDetails: CreatorInventorySourceType.Created,
  purchasedDetails: CreatorInventorySourceType.Purchased,
  sharedDetails: CreatorInventorySourceType.Shared,
};

const apiAssetStateToInventoryState: Partial<
  Record<CreatorInventoryApiState, DevelopmentItemsInventoryItem['state']>
> = {
  [CreatorInventoryApiState.Active]: 'Active',
  [CreatorInventoryApiState.Archived]: 'Archived',
};

export const isDevelopmentItemAsset = (assetType: Asset): boolean =>
  developmentItemAssets.has(assetType);

export const isDevelopmentItemsAssetType = (
  value: string | undefined,
): value is CreatorInventoryAssetType => value != null && developmentItemsAssetTypeSet.has(value);

export const isDevelopmentItemsAssetTypeSelection = (
  value: string | undefined,
): value is DevelopmentItemsAssetTypeSelection => isDevelopmentItemsAssetType(value);

export const isDevelopmentItemsSourceSelection = (
  value: string | undefined,
): value is DevelopmentItemsSourceSelection =>
  value != null && developmentItemsSourceSet.has(value);

export const isDevelopmentItemsView = (value: string | undefined): value is DevelopmentItemsView =>
  value === 'grid' || value === 'list';

export const buildCreatorInventoryScope = (
  userId: number | undefined,
  groupId: number | undefined,
): CreatorInventoryScope | undefined => {
  if (groupId != null) {
    return { type: CreatorInventoryScopeType.Group, id: groupId };
  }
  if (userId != null) {
    return { type: CreatorInventoryScopeType.User, id: userId };
  }
  return undefined;
};

export const buildCreatorInventorySearchFilter = (
  scope: CreatorInventoryScope,
  assetType: CreatorInventoryAssetType,
  source: DevelopmentItemsSourceSelection,
): SearchCreatorInventoryItemsFilter => ({
  assetTypes: [assetTypeToApiAssetType[assetType]],
  ...(scope.type === CreatorInventoryScopeType.Group
    ? { groupIds: [scope.id] }
    : { userIds: [scope.id] }),
  ...(source === DevelopmentItemsSourceFilter.All ? {} : { sources: [source] }),
});

const parseDate = (value: string | Date | undefined): Date | undefined => {
  if (value == null) {
    return undefined;
  }
  const parsedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

const getSources = (sources: CreatorInventorySource[] | undefined) => {
  const result = new Set<DevelopmentItemsInventorySource>();
  sources?.forEach((source) => {
    Object.entries(source).forEach(([detailKey, details]) => {
      if (details == null) {
        return;
      }
      const sourceType = sourceDetailsToSourceType[detailKey];
      if (sourceType != null) {
        result.add(sourceType);
      }
    });
  });
  return [...result];
};

const normalizeAssetType = (
  value: string | number | undefined,
): CreatorInventoryAssetType | undefined => {
  if (value == null) {
    return undefined;
  }
  return normalizedAssetTypes[value.toString().toUpperCase()];
};

export const mapCreatorInventoryItem = (
  item: CreatorInventoryItem,
): DevelopmentItemsInventoryItem | undefined => {
  const asset = item.assetItem?.asset;
  if (asset == null) {
    return undefined;
  }

  const assetId =
    typeof asset.assetId === 'number' ? asset.assetId : Number.parseInt(asset.assetId ?? '', 10);
  if (Number.isNaN(assetId)) {
    return undefined;
  }
  const displayName = asset.displayName?.trim();

  return {
    id: item.path ?? assetId.toString(),
    assetId,
    assetType: normalizeAssetType(asset.assetType),
    created: parseDate(asset.createTime),
    isPackage: item.assetItem?.isPackage === true,
    name: displayName == null || displayName.length === 0 ? assetId.toString() : displayName,
    sources: getSources(item.assetItem?.sources),
    state: asset.state == null ? undefined : apiAssetStateToInventoryState[asset.state],
    updated: parseDate(asset.updateTime),
  };
};
