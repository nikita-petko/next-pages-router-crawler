import { Asset, Item } from '@modules/miscellaneous/common';

export interface AvatarItemDropdown {
  itemType?: Item;
  assetType?: Asset;
  id?: number;
  nameKey: string;
  bundleType?: BundleType;
}

export const MarketplaceItemsApiLimit = 25;

export enum BundleType {
  Unknown = 0,
  Body = 1,
  DynamicHead = 2,
  Shoes = 3,
}
export const AvatarItemDropdownTitles: Partial<Record<Asset, string>> = {
  [Asset.HairAccessory]: 'Label.Body',
  [Asset.Hat]: 'Label.Accessory',
  [Asset.TShirtAccessory]: 'Label.Clothing',
};
export const AvatarMenuMap: Partial<Record<Asset, AvatarItemDropdown[]>> = {
  [Asset.HairAccessory]: [{ assetType: Asset.HairAccessory, nameKey: 'Label.HairAccessories' }],
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
  ],
};
