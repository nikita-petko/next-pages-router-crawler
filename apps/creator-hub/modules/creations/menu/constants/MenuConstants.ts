import {
  V1PermissionsItemTypesGetActionEnum,
  V1PermissionsItemTypesGetTargetTypesEnum,
} from '@rbx/client-itemconfiguration/v1';
import { SearchSortParameter } from '@rbx/client-universes-api/v1';
import { EventSortBy } from '@rbx/client-virtual-events-api/v1';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import { Asset, Item } from '@modules/miscellaneous/common';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';
import getBundleTypeToBundleTypeString from '../../unifiedFeeSystem/helper/unifiedFeeSystemBundleMapping';
import type MenuItem from '../interfaces/MenuItem';

export const allowedAssetTypesForDirectArchiving: Set<Asset> = new Set<Asset>([
  Asset.MyExperiences,
  Asset.SharedExperiences,
  Asset.Audio,
  Asset.Decal,
  Asset.MeshPart,
  Asset.Video,
]);

export const allowedAssetTypesForArchiving: Set<Asset> = new Set<Asset>([
  Asset.MyExperiences,
  Asset.SharedExperiences,
  Asset.Audio,
  Asset.Decal,
  Asset.Image,
  Asset.MeshPart,
  Asset.Video,

  // The following are allowed types for asset delisting.
  // Potential TODO, could create a separate set for allowed delisting types.
  Asset.Hat,
  Asset.HairAccessory,
  Asset.FaceAccessory,
  Asset.NeckAccessory,
  Asset.ShoulderAccessory,
  Asset.FrontAccessory,
  Asset.BackAccessory,
  Asset.WaistAccessory,
  Asset.Shirt,
  Asset.TShirt,
  Asset.Pants,
  Asset.TShirtAccessory,
  Asset.DressSkirtAccessory,
  Asset.JacketAccessory,
  Asset.PantsAccessory,
  Asset.ShirtAccessory,
  Asset.ShortsAccessory,
  Asset.SweaterAccessory,
  Asset.EmoteAnimation,
  Asset.EyebrowAccessory,
  Asset.EyelashAccessory,
  Asset.FaceMakeup,
  Asset.LipMakeup,
  Asset.EyeMakeup,
  Asset.AvatarBackground,
]);

export const allowedAssetTypesForSorting: Set<Asset> = new Set<Asset>([
  Asset.MyExperiences,
  Asset.SharedExperiences,
  Asset.UpcomingEvent,
  Asset.PastEvent,
  Asset.DraftEvent,
]);

const avatarItemsAssetTypes: Set<Asset> = new Set<Asset>([
  Asset.TShirt,
  Asset.Shirt,
  Asset.Pants,
  Asset.Hat,
  Asset.HairAccessory,
  Asset.FaceAccessory,
  Asset.NeckAccessory,
  Asset.ShoulderAccessory,
  Asset.FrontAccessory,
  Asset.BackAccessory,
  Asset.WaistAccessory,
  Asset.TShirtAccessory,
  Asset.ShirtAccessory,
  Asset.PantsAccessory,
  Asset.JacketAccessory,
  Asset.SweaterAccessory,
  Asset.ShortsAccessory,
  Asset.DressSkirtAccessory,
]);

const avatarItemsBundleTypes: Set<BundleType> = new Set<BundleType>([
  BundleType.Body,
  BundleType.DynamicHead,
  BundleType.Shoes,
]);

export const dynamicAvatarItemsAssetTypes: Set<Asset> = new Set<Asset>();
export const dynamicAvatarItemsBundleTypes: Set<BundleType> = new Set<BundleType>();

export type AllowedMarketplaceItemTypes = {
  assetTypes: Set<Asset>;
  bundleTypes: Set<BundleType>;
};

/** Defaults used when the marketplace permissions API fails. */
export function getDefaultAllowedMarketplaceItemTypes(): AllowedMarketplaceItemTypes {
  return {
    assetTypes: new Set(avatarItemsAssetTypes),
    bundleTypes: new Set(avatarItemsBundleTypes),
  };
}

/**
 * The item types the creator may upload, kept apart from the publish-permitted sets above because a
 * type can open for upload before it opens for publishing.
 */
export const uploadableAvatarItemsAssetTypes: Set<Asset> = new Set<Asset>();
export const uploadableAvatarItemsBundleTypes: Set<BundleType> = new Set<BundleType>();

let inflightAllowedMarketplaceItemTypes: Promise<AllowedMarketplaceItemTypes> | null = null;
let inflightUploadableMarketplaceItemTypes: Promise<AllowedMarketplaceItemTypes> | null = null;

async function fetchAndCacheItemTypesForAction(
  action: V1PermissionsItemTypesGetActionEnum,
  assetTypes: Set<Asset>,
  bundleTypes: Set<BundleType>,
): Promise<AllowedMarketplaceItemTypes> {
  try {
    const response = await itemconfigurationClient.getAllowedAssetTypes(action, [
      V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_0, // Asset type
      V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_1, // Bundle type
    ]);

    // Convert the response to a Set of Asset types and add to the allowed set
    response.allowedAssetTypes?.forEach((assetType) => {
      let assetTypeConverted = assetType;

      // If we don't do this, the asset type won't match the asset type in the menu items
      if (assetTypeConverted === 'Tshirt') {
        assetTypeConverted = 'TShirt';
      } else if (assetTypeConverted === 'TshirtAccessory') {
        assetTypeConverted = 'TShirtAccessory';
      }

      if (isValidEnumValue(Asset, assetTypeConverted)) {
        assetTypes.add(assetTypeConverted);
      }
    });

    response.allowedBundleTypes?.forEach((bundleType) => {
      const bundleTypeEnum = getBundleTypeToBundleTypeString(bundleType);
      if (bundleTypeEnum !== BundleType.Unknown) {
        bundleTypes.add(bundleTypeEnum);
      }
    });

    return { assetTypes, bundleTypes };
  } catch {
    // If the API call fails, return the default list
    return getDefaultAllowedMarketplaceItemTypes();
  }
}

export async function getAllowedMarketplaceItemTypes(): Promise<AllowedMarketplaceItemTypes> {
  if (dynamicAvatarItemsAssetTypes.size > 0) {
    return {
      assetTypes: dynamicAvatarItemsAssetTypes,
      bundleTypes: dynamicAvatarItemsBundleTypes,
    };
  }

  inflightAllowedMarketplaceItemTypes ??= fetchAndCacheItemTypesForAction(
    V1PermissionsItemTypesGetActionEnum.NUMBER_2, // Publish Marketplace Action
    dynamicAvatarItemsAssetTypes,
    dynamicAvatarItemsBundleTypes,
  ).finally(() => {
    inflightAllowedMarketplaceItemTypes = null;
  });

  return inflightAllowedMarketplaceItemTypes;
}

/** The {@link getAllowedMarketplaceItemTypes} equivalent for the upload permission. */
export async function getUploadableMarketplaceItemTypes(): Promise<AllowedMarketplaceItemTypes> {
  if (uploadableAvatarItemsAssetTypes.size > 0) {
    return {
      assetTypes: uploadableAvatarItemsAssetTypes,
      bundleTypes: uploadableAvatarItemsBundleTypes,
    };
  }

  inflightUploadableMarketplaceItemTypes ??= fetchAndCacheItemTypesForAction(
    V1PermissionsItemTypesGetActionEnum.NUMBER_1, // Upload Action
    uploadableAvatarItemsAssetTypes,
    uploadableAvatarItemsBundleTypes,
  ).finally(() => {
    inflightUploadableMarketplaceItemTypes = null;
  });

  return inflightUploadableMarketplaceItemTypes;
}

/**
 * The asset types whose Avatar Items entry point the creator may see: the publish-permitted types,
 * plus Avatar Background when they may upload one. Backgrounds open for upload ahead of publishing,
 * so the entry point has to appear while publish access is still withheld; publishing itself stays
 * gated on the publish permission, which the API enforces. All other types follow publish access.
 */
export async function getAvatarItemsEntryPointAssetTypes(): Promise<Set<Asset>> {
  const [allowed, uploadable] = await Promise.all([
    getAllowedMarketplaceItemTypes(),
    getUploadableMarketplaceItemTypes(),
  ]);

  // Copied rather than added to: the publish-permitted set is shared with callers that have to keep
  // publish semantics, such as the item cards and the avatar analytics header.
  const entryPointAssetTypes = new Set(allowed.assetTypes);
  if (uploadable.assetTypes.has(Asset.AvatarBackground)) {
    entryPointAssetTypes.add(Asset.AvatarBackground);
  }

  return entryPointAssetTypes;
}

export const allowedItemTypesForUploading: Set<Item> = new Set<Item>([]);

export const universeSortTranslationKeys: Record<SearchSortParameter, string> = {
  [SearchSortParameter.GameCreated]: 'Label.DateOfCreation',
  [SearchSortParameter.GameName]: 'Label.Alphabetical',
  [SearchSortParameter.LastUpdated]: 'Label.LastUpdatedDate',
};

export const eventSortTranslationKeys: { [key in EventSortBy]: string } = {
  [EventSortBy.CreatedUtc]: 'Label.DateOfCreation',
  [EventSortBy.StartUtc]: 'Label.StartDate',
};

const menuItems: MenuItem[] = [
  {
    type: Asset.Place,
    nameKey: 'Label.Experiences',
    submenuItems: [
      { type: Asset.MyExperiences, nameKey: 'Label.MyExperiences' },
      { type: Asset.SharedExperiences, nameKey: 'Label.SharedExperiences' },
    ],
  },
  {
    type: Asset.ShareLink,
    nameKey: 'Label.ShareLinks',
  },
  {
    type: Asset.TShirt,
    nameKey: 'Label.AvatarItems',
    submenuItems: [
      {
        type: Asset.AvatarLooks,
        nameKey: 'Label.Avatars',
      },
      {
        type: Asset.AvatarBackground,
        nameKey: 'Label.Backgrounds',
      },
      {
        type: Asset.HairAccessory,
        nameKey: 'Label.Bodies',
        itemType: Item.Bundle,
      },
      {
        type: Asset.EyeMakeup,
        nameKey: 'Label.Makeup',
      },
      {
        type: Asset.TShirtAccessory,
        nameKey: 'Label.Clothing',
      },
      {
        type: Asset.Hat,
        nameKey: 'Label.Accessories',
      },
      {
        type: Asset.TShirt,
        nameKey: 'Label.Classics',
      },
      {
        type: Asset.EmoteAnimation,
        nameKey: 'Label.Animations',
      },
      {
        type: Asset.AllCatalogAsset,
        nameKey: 'Label.AllAssetTypes',
      },
    ],
  },
  {
    type: Asset.Decal,
    nameKey: 'Label.DevelopmentItems',
    submenuItems: [
      { type: Asset.Model, nameKey: 'Label.ModelsAndPackages' },
      { type: Asset.Plugin, nameKey: 'Label.Plugins' },
      { type: Asset.Audio, nameKey: 'Label.Audios' },
      { type: Asset.Decal, nameKey: 'Label.Decals' },
      { type: Asset.Image, nameKey: 'Label.Images' },
      { type: Asset.Video, nameKey: 'Label.Videos' },
      { type: Asset.Mesh, nameKey: 'Label.Meshes' },
      { type: Asset.MeshPart, nameKey: 'Label.MeshParts' },
      { type: Asset.Animation, nameKey: 'Label.Animations' },
    ],
  },
  {
    type: Asset.Moments,
    nameKey: 'Label.Moments',
  },
  {
    type: Asset.AssetPermissionRequests,
    nameKey: 'Label.Requests',
  },
];

export default menuItems;
