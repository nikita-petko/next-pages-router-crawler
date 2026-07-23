import { Asset, Item } from '@modules/miscellaneous/common';
import { SearchSortParameter } from '@rbx/clients/universesApi';
import { EventSortBy } from '@rbx/clients/virtualEventsApi';
import { itemconfigurationClient } from '@modules/clients';
import {
  V1PermissionsItemTypesGetActionEnum,
  V1PermissionsItemTypesGetTargetTypesEnum,
} from '@rbx/client-itemconfiguration/v1';
import MenuItem from '../interfaces/MenuItem';

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

export const dynamicAvatarItemsAssetTypes: Set<Asset> = new Set<Asset>();

export async function getAllowedAssetTypes(): Promise<Set<Asset>> {
  if (dynamicAvatarItemsAssetTypes.size > 0) {
    return dynamicAvatarItemsAssetTypes;
  }

  try {
    // Get allowed asset types for the publish marketplace action and asset target type
    const response = await itemconfigurationClient.getAllowedAssetTypes(
      V1PermissionsItemTypesGetActionEnum.NUMBER_2,
      [V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_0],
    );

    // Convert the response to a Set of Asset types and add to the allowed set
    response.allowedAssetTypes?.forEach((assetType) => {
      let assetTypeConverted = assetType;

      // If we don't do this, the asset type won't match the asset type in the menu items
      if (assetTypeConverted === 'Tshirt') {
        assetTypeConverted = 'TShirt';
      } else if (assetTypeConverted === 'TshirtAccessory') {
        assetTypeConverted = 'TShirtAccessory';
      }

      dynamicAvatarItemsAssetTypes.add(assetTypeConverted as Asset);
    });

    return dynamicAvatarItemsAssetTypes;
  } catch {
    // If the API call fails, return the default list
    return new Set(avatarItemsAssetTypes);
  }
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
];

export default menuItems;
