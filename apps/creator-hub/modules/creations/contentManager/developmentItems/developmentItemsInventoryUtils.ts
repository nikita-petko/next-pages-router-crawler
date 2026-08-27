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

const ungatedDevelopmentItemsAssetTypes = [
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

// TextDocument (asset type 93) is behind the `isTextDocumentEnabled` flag. It maps to
// ASSET_TYPE_TEXT_DOCUMENT — never ASSET_TYPE_TEXT, which is the unrelated legacy Text type (7).
const allDevelopmentItemsAssetTypes = [
  ...ungatedDevelopmentItemsAssetTypes,
  CreatorInventoryAssetType.TextDocument,
] as const;

// Mirrors the legacy `allowedAssetTypesForDirectArchiving`, minus the experience types, which are
// not development items. Every other type can only be archived through its composite asset.
const directlyArchivableDevelopmentItemsAssetTypes = new Set<CreatorInventoryAssetType>([
  CreatorInventoryAssetType.Audio,
  CreatorInventoryAssetType.Decal,
  CreatorInventoryAssetType.MeshPart,
  CreatorInventoryAssetType.TextDocument,
  CreatorInventoryAssetType.Video,
]);

const developmentItemsAssetTypeSet = new Set<string>(allDevelopmentItemsAssetTypes);
const textDocumentAssetTypeSet = new Set<string>([CreatorInventoryAssetType.TextDocument]);
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

// Bridges the inventory asset type back to the shared `Asset` enum, which drives per-asset-type
// resources such as empty-state copy and illustrations.
export const developmentItemsAssetTypeToAsset: Record<CreatorInventoryAssetType, Asset> = {
  [CreatorInventoryAssetType.Animation]: Asset.Animation,
  [CreatorInventoryAssetType.Audio]: Asset.Audio,
  [CreatorInventoryAssetType.Decal]: Asset.Decal,
  [CreatorInventoryAssetType.Image]: Asset.Image,
  [CreatorInventoryAssetType.Mesh]: Asset.Mesh,
  [CreatorInventoryAssetType.MeshPart]: Asset.MeshPart,
  [CreatorInventoryAssetType.Model]: Asset.Model,
  [CreatorInventoryAssetType.Plugin]: Asset.Plugin,
  [CreatorInventoryAssetType.TextDocument]: Asset.TextDocument,
  [CreatorInventoryAssetType.Video]: Asset.Video,
};

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
  [CreatorInventoryAssetType.TextDocument]: CreatorInventoryApiAssetType.TextDocument,
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
  '93': CreatorInventoryAssetType.TextDocument,
  ANIMATION: CreatorInventoryAssetType.Animation,
  ASSET_TYPE_ANIMATION: CreatorInventoryAssetType.Animation,
  ASSET_TYPE_AUDIO: CreatorInventoryAssetType.Audio,
  ASSET_TYPE_DECAL: CreatorInventoryAssetType.Decal,
  ASSET_TYPE_IMAGE: CreatorInventoryAssetType.Image,
  ASSET_TYPE_MESH: CreatorInventoryAssetType.Mesh,
  ASSET_TYPE_MESH_PART: CreatorInventoryAssetType.MeshPart,
  ASSET_TYPE_MODEL: CreatorInventoryAssetType.Model,
  ASSET_TYPE_PLUGIN: CreatorInventoryAssetType.Plugin,
  ASSET_TYPE_TEXT_DOCUMENT: CreatorInventoryAssetType.TextDocument,
  ASSET_TYPE_VIDEO: CreatorInventoryAssetType.Video,
  AUDIO: CreatorInventoryAssetType.Audio,
  DECAL: CreatorInventoryAssetType.Decal,
  IMAGE: CreatorInventoryAssetType.Image,
  MESH: CreatorInventoryAssetType.Mesh,
  MESHPART: CreatorInventoryAssetType.MeshPart,
  MODEL: CreatorInventoryAssetType.Model,
  PLUGIN: CreatorInventoryAssetType.Plugin,
  TEXTDOCUMENT: CreatorInventoryAssetType.TextDocument,
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

/**
 * Text documents are behind the `isTextDocumentEnabled` flag, so callers pass the resolved gate.
 * An unresolved gate (`undefined`) is treated as disabled.
 */
export const getDevelopmentItemsAssetTypes = (
  isTextDocumentEnabled?: boolean,
): readonly CreatorInventoryAssetType[] =>
  isTextDocumentEnabled === true
    ? allDevelopmentItemsAssetTypes
    : ungatedDevelopmentItemsAssetTypes;

/**
 * The scoped-search options: the active type first, then every other type the creator can see.
 * Gated types are excluded so search never offers a scope the tab row does not have.
 */
export const getDevelopmentItemsSearchAssetTypes = (
  activeAssetType: DevelopmentItemsAssetTypeSelection,
  isTextDocumentEnabled?: boolean,
): DevelopmentItemsAssetTypeSelection[] => [
  activeAssetType,
  ...getDevelopmentItemsAssetTypes(isTextDocumentEnabled).filter(
    (assetType) => assetType !== activeAssetType,
  ),
];

/**
 * Whether an asset type is served by the consolidated Creator Inventory flow.
 *
 * `isTextDocumentEnabled` is required rather than optional, and accepts `undefined` for a gate that
 * has not resolved yet. Omitting it read as "gate off", so a caller that forgot it silently got
 * `false` for text documents with no type error — which is how the filter-reset check in
 * `CreationsContainer` came to treat Model ↔ TextDocument as leaving the consolidated flow.
 */
export const isDevelopmentItemAsset = (
  assetType: Asset,
  isTextDocumentEnabled: boolean | undefined,
): boolean => {
  if (assetType === Asset.TextDocument) {
    return isTextDocumentEnabled === true;
  }
  return developmentItemAssets.has(assetType);
};

/**
 * Whether an item's asset type has a visual thumbnail worth requesting.
 *
 * Text documents have no visual representation, and the thumbnails service is called with a
 * placeholder return policy — so asking for one yields a placeholder image rather than nothing,
 * which would render a meaningless icon. Mirrors the developer-item status card and configure form,
 * which omit the thumbnail for text documents for the same reason.
 *
 * An unknown asset type keeps its thumbnail: absent evidence, the visual types are the common case.
 */
export const hasDevelopmentItemThumbnail = (
  assetType: CreatorInventoryAssetType | undefined,
): boolean => assetType !== CreatorInventoryAssetType.TextDocument;

export const isDevelopmentItemDirectlyArchivable = (
  assetType: CreatorInventoryAssetType | undefined,
): boolean => assetType != null && directlyArchivableDevelopmentItemsAssetTypes.has(assetType);

/**
 * Whether an item's asset type has a Creator Store page worth linking to.
 *
 * Text documents are not listed on Creator Store, so "View Asset Details" would open a page that
 * does not exist. Mirrors the legacy `MARKETPLACE_LINK_EXCLUDED_ASSETS`, which drops the developer
 * item sidebar's "open in marketplace" link for the same reason.
 *
 * An unknown asset type keeps the link: absent evidence, the listed types are the common case.
 */
export const hasDevelopmentItemCreatorStorePage = (
  assetType: CreatorInventoryAssetType | undefined,
): boolean => assetType !== CreatorInventoryAssetType.TextDocument;

export const canConfigureDevelopmentItem = (item: DevelopmentItemsInventoryItem): boolean =>
  item.sources.includes(CreatorInventorySourceType.Created);

export const isDevelopmentItemsAssetType = (
  value: string | undefined,
  isTextDocumentEnabled?: boolean,
): value is CreatorInventoryAssetType => {
  if (value == null || !developmentItemsAssetTypeSet.has(value)) {
    return false;
  }
  if (textDocumentAssetTypeSet.has(value)) {
    return isTextDocumentEnabled === true;
  }
  return true;
};

export const isDevelopmentItemsAssetTypeSelection = (
  value: string | undefined,
  isTextDocumentEnabled?: boolean,
): value is DevelopmentItemsAssetTypeSelection =>
  isDevelopmentItemsAssetType(value, isTextDocumentEnabled);

export const isDevelopmentItemsSourceSelection = (
  value: string | undefined,
): value is DevelopmentItemsSourceSelection =>
  value != null && developmentItemsSourceSet.has(value);

export const isDevelopmentItemsView = (value: string | undefined): value is DevelopmentItemsView =>
  value === 'grid' || value === 'list';

export const getLegacyDevelopmentItemsAssetType = (
  assetType: DevelopmentItemsAssetTypeSelection,
): Asset => developmentItemsAssetTypeToAsset[assetType];

export const hasActiveDevelopmentItemsInventoryFilters = ({
  query,
  showArchived,
  source,
}: {
  query: string;
  showArchived: boolean;
  source: DevelopmentItemsSourceSelection;
}): boolean =>
  query.trim().length > 0 || showArchived || source !== CreatorInventorySourceType.Created;

export const filterDevelopmentItemsByArchivedState = (
  items: DevelopmentItemsInventoryItem[],
  showArchived: boolean,
): DevelopmentItemsInventoryItem[] =>
  items.filter((item) => (showArchived ? item.state === 'Archived' : item.state !== 'Archived'));

export const mergeOptimisticArchivedDevelopmentItems = (
  items: DevelopmentItemsInventoryItem[],
  optimisticItems: ReadonlyMap<number, DevelopmentItemsInventoryItem>,
  assetType: DevelopmentItemsAssetTypeSelection,
): DevelopmentItemsInventoryItem[] => {
  const existingAssetIds = new Set(items.map((item) => item.assetId));
  return [
    ...items,
    ...[...optimisticItems.values()].filter(
      (item) => item.assetType === assetType && !existingAssetIds.has(item.assetId),
    ),
  ];
};

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
