import { SalesType as AvatarItemSalesType } from './developerAnalyticsAggregations';

// NOTE(shumingxu, 12/01/2023): Type strings are a combination of {Asset/Bundle}_{Category ID} generated
// in developer-analytics-aggregations, where {Category ID} is returned by asset registry / bundle details apis.
// When a new category ID (or even new target type) is introduced, this enum could break and
// would currently default to T Shirt Asset.
// To fix this add the new type string here, or a more permanent solution would be to do type-checking in DAA.
// All the asset types should be listed on this page: go/assets
export enum AvatarItemType {
  TShirt = 'Asset_2',
  Hat = 'Asset_8',
  Shirt = 'Asset_11',
  Pants = 'Asset_12',
  Head = 'Asset_17',
  Face = 'Asset_18',
  Gear = 'Asset_19',
  HairAccessory = 'Asset_41',
  FaceAccessory = 'Asset_42',
  NeckAccessory = 'Asset_43',
  ShoulderAccessory = 'Asset_44',
  FrontAccessory = 'Asset_45',
  BackAccessory = 'Asset_46',
  WaistAccessory = 'Asset_47',
  EmoteAnimation = 'Asset_61',
  TShirtAccessory = 'Asset_64',
  ShirtAccessory = 'Asset_65',
  PantsAccessory = 'Asset_66',
  JacketAccessory = 'Asset_67',
  SweaterAccessory = 'Asset_68',
  ShortsAccessory = 'Asset_69',
  DressSkirtAccessory = 'Asset_72',
  EyebrowAccessory = 'Asset_76',
  EyelashAccessory = 'Asset_77',
  FaceMakeup = 'Asset_88',
  LipMakeup = 'Asset_89',
  EyeMakeup = 'Asset_90',
  GenericBundle = 'Bundle_0',
  Bodies = 'Bundle_1',
  Heads = 'Bundle_2',
  Shoes = 'Bundle_3',
  AvatarAnimations = 'Bundle_4',
}

export const AllAvatarItemTypesOption = 'AllAvatarItemTypesOption';

export const SupportedAvatarItemTypeFilterOrder: Array<
  AvatarItemType | typeof AllAvatarItemTypesOption
> = [
  AllAvatarItemTypesOption,
  AvatarItemType.TShirt,
  AvatarItemType.Hat,
  AvatarItemType.Shirt,
  AvatarItemType.Pants,
  AvatarItemType.HairAccessory,
  AvatarItemType.FaceAccessory,
  AvatarItemType.NeckAccessory,
  AvatarItemType.ShoulderAccessory,
  AvatarItemType.FrontAccessory,
  AvatarItemType.BackAccessory,
  AvatarItemType.WaistAccessory,
  AvatarItemType.EmoteAnimation,
  AvatarItemType.TShirtAccessory,
  AvatarItemType.ShirtAccessory,
  AvatarItemType.PantsAccessory,
  AvatarItemType.JacketAccessory,
  AvatarItemType.SweaterAccessory,
  AvatarItemType.ShortsAccessory,
  AvatarItemType.DressSkirtAccessory,
  AvatarItemType.EyebrowAccessory,
  AvatarItemType.EyelashAccessory,
  AvatarItemType.FaceMakeup,
  AvatarItemType.LipMakeup,
  AvatarItemType.EyeMakeup,
  AvatarItemType.Heads,
  AvatarItemType.Bodies,
  AvatarItemType.Shoes,
  AvatarItemType.AvatarAnimations,
];

export const AllAvatarItemSalesTypesOption = 'AllAvatarItemSalesTypesOption';

export const SupportedAvatarItemSalesTypeFilterOrder = [
  AllAvatarItemSalesTypesOption,
  AvatarItemSalesType.Limited,
  AvatarItemSalesType.Unlimited,
];

export const enum AvatarItemTargetType {
  AssetItem = 'AssetItem',
  Bundle = 'Bundle',
}

export const AvatarItemTypeToTargetType: Record<AvatarItemType, AvatarItemTargetType> = {
  [AvatarItemType.TShirt]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.Hat]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.Shirt]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.Pants]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.Head]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.Face]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.Gear]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.HairAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.FaceAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.NeckAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.ShoulderAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.FrontAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.BackAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.WaistAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.EmoteAnimation]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.TShirtAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.ShirtAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.PantsAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.JacketAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.SweaterAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.ShortsAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.DressSkirtAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.EyebrowAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.EyelashAccessory]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.FaceMakeup]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.LipMakeup]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.EyeMakeup]: AvatarItemTargetType.AssetItem,
  [AvatarItemType.GenericBundle]: AvatarItemTargetType.Bundle,
  [AvatarItemType.Heads]: AvatarItemTargetType.Bundle,
  [AvatarItemType.Bodies]: AvatarItemTargetType.Bundle,
  [AvatarItemType.Shoes]: AvatarItemTargetType.Bundle,
  [AvatarItemType.AvatarAnimations]: AvatarItemTargetType.Bundle,
};
