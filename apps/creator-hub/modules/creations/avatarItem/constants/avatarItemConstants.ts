import { Asset, Item } from '@modules/miscellaneous/common';
import Look from '@modules/miscellaneous/common/enums/Look';

export interface AvatarItemDropdown {
  itemType?: Item;
  assetType?: Asset;
  lookType?: Look;
  id?: number;
  nameKey: string;
  bundleType?: BundleType;
  isFolder?: boolean;
  skipTranslation?: boolean;
  folderId?: string;
}

export const MarketplaceItemsApiLimit = 25;

export const GetItemsByCreatorApiLimit = 30;

export enum BundleType {
  Unknown = 0,
  Body = 1,
  DynamicHead = 2,
  Shoes = 3,
}
export const AvatarItemDropdownTitles: Partial<Record<Asset, string>> = {
  [Asset.HairAccessory]: 'Label.Body',
  [Asset.TShirt]: 'Label.Classic',
  [Asset.Hat]: 'Label.Accessory',
  [Asset.TShirtAccessory]: 'Label.Clothing',
  [Asset.EmoteAnimation]: 'Label.Animation',
  [Asset.AllCatalogAsset]: 'Label.Folder',
  [Asset.EyeMakeup]: 'Label.Makeup',
};
export const AvatarMenuMap: Partial<Record<Asset, AvatarItemDropdown[]>> = {
  [Asset.HairAccessory]: [
    { assetType: Asset.HairAccessory, nameKey: 'Label.HairAccessories' },
    { itemType: Item.Bundle, id: 2, nameKey: 'Label.Bodies', bundleType: BundleType.Body },
    {
      itemType: Item.Bundle,
      id: 2,
      nameKey: 'Label.DynamicHeads',
      bundleType: BundleType.DynamicHead,
    },
  ],
  [Asset.TShirt]: [
    { assetType: Asset.TShirt, nameKey: 'Label.ClassicTShirts' },
    { assetType: Asset.Shirt, nameKey: 'Label.ClassicShirts' },
    { assetType: Asset.Pants, nameKey: 'Label.ClassicPants' },
  ],
  [Asset.Hat]: [
    { assetType: Asset.Hat, nameKey: 'Label.Hats' },
    { assetType: Asset.HairAccessory, nameKey: 'Label.HairAccessories' },
    { assetType: Asset.FaceAccessory, nameKey: 'Label.FaceAccessories' },
    { assetType: Asset.NeckAccessory, nameKey: 'Label.NeckAccessories' },
    { assetType: Asset.ShoulderAccessory, nameKey: 'Label.ShoulderAccessories' },
    { assetType: Asset.FrontAccessory, nameKey: 'Label.FrontAccessories' },
    { assetType: Asset.BackAccessory, nameKey: 'Label.BackAccessories' },
    { assetType: Asset.WaistAccessory, nameKey: 'Label.WaistAccessories' },
  ],
  [Asset.TShirtAccessory]: [
    { assetType: Asset.TShirtAccessory, nameKey: 'Label.TShirts' },
    { assetType: Asset.ShirtAccessory, nameKey: 'Label.Shirts' },
    { assetType: Asset.PantsAccessory, nameKey: 'Label.Pants' },
    { assetType: Asset.JacketAccessory, nameKey: 'Label.Jackets' },
    { assetType: Asset.SweaterAccessory, nameKey: 'Label.Sweaters' },
    { assetType: Asset.ShortsAccessory, nameKey: 'Label.ShortsAccessories' },
    { assetType: Asset.DressSkirtAccessory, nameKey: 'Label.Skirts' },
    {
      itemType: Item.Bundle,
      nameKey: 'Label.Shoes',
      bundleType: BundleType.Shoes,
    },
  ],
  [Asset.EmoteAnimation]: [{ assetType: Asset.EmoteAnimation, nameKey: 'Label.Emote' }],
  [Asset.EyeMakeup]: [
    { assetType: Asset.EyeMakeup, nameKey: 'Label.EyeMakeupAccessories' },
    { assetType: Asset.LipMakeup, nameKey: 'Label.LipMakeupAccessories' },
    { assetType: Asset.FaceMakeup, nameKey: 'Label.FaceMakeupAccessories' },
    { assetType: Asset.EyebrowAccessory, nameKey: 'Label.EyebrowAccessories' },
    { assetType: Asset.EyelashAccessory, nameKey: 'Label.EyelashAccessories' },
    { lookType: Look.Makeup, nameKey: 'Label.Looks' },
  ],
};

export const UnfolderedDropdownOption: AvatarItemDropdown = {
  nameKey: 'Label.Unfoldered',
  isFolder: true,
  skipTranslation: false,
};

/**
 * TShirtAccessory (64), PantsAccessory (66), SweaterAccessory (68). When these are the only
 * allowed rentable types, Timed Options uses the classic Turn All On/Off flow (backward compatible).
 */
export const ORIGINAL_TIMED_OPTIONS_ASSET_TYPES = new Set<Asset>([
  Asset.TShirtAccessory,
  Asset.PantsAccessory,
  Asset.SweaterAccessory,
]);

/** 3D clothing rows under the T-shirt menu (Timed Options bulk UI). */
export const CLOTHING_ASSET_TYPES: Asset[] = [
  Asset.TShirtAccessory,
  Asset.ShirtAccessory,
  Asset.PantsAccessory,
  Asset.JacketAccessory,
  Asset.SweaterAccessory,
  Asset.ShortsAccessory,
  Asset.DressSkirtAccessory,
];

/** Makeup and related avatar rows (Timed Options bulk UI). */
export const MAKEUP_ASSET_TYPES: Asset[] = [
  Asset.EyeMakeup,
  Asset.LipMakeup,
  Asset.FaceMakeup,
  Asset.EyebrowAccessory,
  Asset.EyelashAccessory,
];

/** Classic accessories under the hat menu (Timed Options bulk UI). */
export const ACCESSORY_ASSET_TYPES: Asset[] = [
  Asset.Hat,
  Asset.HairAccessory,
  Asset.FaceAccessory,
  Asset.NeckAccessory,
  Asset.ShoulderAccessory,
  Asset.FrontAccessory,
  Asset.BackAccessory,
  Asset.WaistAccessory,
];
