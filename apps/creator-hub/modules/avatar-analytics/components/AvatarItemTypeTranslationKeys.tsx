import { TranslationKey, translationKey } from '@modules/analytics-translations';
import {
  AllAvatarItemSalesTypesOption,
  AllAvatarItemTypesOption,
  AvatarItemSalesType,
  AvatarItemType,
} from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const AvatarItemTypeTranslationKeys: Partial<Record<AvatarItemType, TranslationKey>> = {
  // from: https://roblox.atlassian.net/wiki/spaces/CON/pages/1539803049/Asset+Type
  [AvatarItemType.TShirt]: translationKey(
    'Label.ItemType.TShirts',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.Hat]: translationKey('Label.ItemType.Hat', TranslationNamespace.AvatarAnalytics),
  [AvatarItemType.Shirt]: translationKey(
    'Label.ItemType.Shirts',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.Pants]: translationKey(
    'Label.ItemType.Pants',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.HairAccessory]: translationKey(
    'Label.ItemType.HairAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.FaceAccessory]: translationKey(
    'Label.ItemType.FaceAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.NeckAccessory]: translationKey(
    'Label.ItemType.NeckAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.ShoulderAccessory]: translationKey(
    'Label.ItemType.ShoulderAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.FrontAccessory]: translationKey(
    'Label.ItemType.FrontAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.BackAccessory]: translationKey(
    'Label.ItemType.BackAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.WaistAccessory]: translationKey(
    'Label.ItemType.WaistAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.EmoteAnimation]: translationKey(
    'Label.ItemType.Emotes',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.TShirtAccessory]: translationKey(
    'Label.ItemType.TShirtAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.ShirtAccessory]: translationKey(
    'Label.ItemType.ShirtAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.PantsAccessory]: translationKey(
    'Label.ItemType.PantsAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.JacketAccessory]: translationKey(
    'Label.ItemType.JacketAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.SweaterAccessory]: translationKey(
    'Label.ItemType.SweaterAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.ShortsAccessory]: translationKey(
    'Label.ItemType.ShortsAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.DressSkirtAccessory]: translationKey(
    'Label.ItemType.DressSkirtsAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.Heads]: translationKey('Label.Heads', TranslationNamespace.AvatarAnalytics),
  [AvatarItemType.Bodies]: translationKey('Label.Bodies', TranslationNamespace.AvatarAnalytics),
  [AvatarItemType.Shoes]: translationKey('Label.Shoes', TranslationNamespace.AvatarAnalytics),
  [AvatarItemType.AvatarAnimations]: translationKey(
    'Label.AvatarAnimations',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.EyebrowAccessory]: translationKey(
    'Label.EyebrowAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.EyelashAccessory]: translationKey(
    'Label.EyelashAccessories',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.FaceMakeup]: translationKey(
    'Label.FaceMakeup',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.LipMakeup]: translationKey(
    'Label.LipMakeup',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemType.EyeMakeup]: translationKey(
    'Label.EyeMakeup',
    TranslationNamespace.AvatarAnalytics,
  ),
};

export const FormatAvatarItemTypeRaw = (
  avatarItemType?: AvatarItemType | typeof AllAvatarItemTypesOption,
): TranslationKey => {
  const defaultKey = translationKey('Label.Accessories', TranslationNamespace.AssetTypes);
  if (!avatarItemType) {
    return defaultKey;
  }
  if (avatarItemType === AllAvatarItemTypesOption) {
    return translationKey('Label.AllAvatarItemTypes', TranslationNamespace.AvatarAnalytics);
  }
  return AvatarItemTypeTranslationKeys[avatarItemType] ?? defaultKey;
};

const AvatarItemSalesTypeTranslationKeys: Record<AvatarItemSalesType, TranslationKey> = {
  [AvatarItemSalesType.Limited]: translationKey(
    'Label.Limited',
    TranslationNamespace.AvatarAnalytics,
  ),
  [AvatarItemSalesType.Unlimited]: translationKey(
    'Label.NonLimited',
    TranslationNamespace.AvatarAnalytics,
  ),
};

export const FormatAvatarItemSalesTypeRaw = (
  avatarItemSalesType: AvatarItemSalesType | typeof AllAvatarItemSalesTypesOption | undefined,
): TranslationKey => {
  if (avatarItemSalesType === undefined || avatarItemSalesType === AllAvatarItemSalesTypesOption) {
    return translationKey('Label.AllAvatarItemSalesTypes', TranslationNamespace.AvatarAnalytics);
  }
  return AvatarItemSalesTypeTranslationKeys[avatarItemSalesType];
};
