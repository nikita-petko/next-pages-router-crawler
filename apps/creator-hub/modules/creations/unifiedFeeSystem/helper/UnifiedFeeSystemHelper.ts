import { Asset, Item as ItemType, itemTypeToPath } from '@modules/miscellaneous/common';
import {
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
  RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
  V1ItemsByCreatorGetAssetTypeEnum,
} from '@rbx/client-itemconfiguration/v1';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';
import {
  ValidTimedOptionsAssetTypes,
  ValidTimedOptionsBundleTypes,
  ValidWearTimeAssetTypes,
  ValidWearTimeBundleTypes,
} from './UnifiedFeeSystemConstants';

export function getConfigurePageUrl(itemType: ItemType, itemId: string | number | undefined) {
  return `/dashboard/creations/${itemTypeToPath[itemType]}/${itemId}/configure`;
}

export function getPublishPageUrl(itemType: ItemType, itemId: string | number | undefined) {
  return `/dashboard/creations/${itemTypeToPath[itemType]}/${itemId}/publish`;
}

const ASSET_TYPE_MAPPING: Record<
  Asset,
  { asset: Asset; apiType: V1ItemsByCreatorGetAssetTypeEnum }
> = {
  [Asset.Place]: { asset: Asset.Place, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_9 },
  [Asset.TShirt]: { asset: Asset.TShirt, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_2 },
  [Asset.Shirt]: { asset: Asset.Shirt, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_11 },
  [Asset.Pants]: { asset: Asset.Pants, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_12 },
  [Asset.Hat]: { asset: Asset.Hat, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_8 },
  [Asset.HairAccessory]: {
    asset: Asset.HairAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_41,
  },
  [Asset.FaceAccessory]: {
    asset: Asset.FaceAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_42,
  },
  [Asset.NeckAccessory]: {
    asset: Asset.NeckAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_43,
  },
  [Asset.ShoulderAccessory]: {
    asset: Asset.ShoulderAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_44,
  },
  [Asset.FrontAccessory]: {
    asset: Asset.FrontAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_45,
  },
  [Asset.BackAccessory]: {
    asset: Asset.BackAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_46,
  },
  [Asset.WaistAccessory]: {
    asset: Asset.WaistAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_47,
  },
  [Asset.TShirtAccessory]: {
    asset: Asset.TShirtAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_64,
  },
  [Asset.ShirtAccessory]: {
    asset: Asset.ShirtAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_65,
  },
  [Asset.PantsAccessory]: {
    asset: Asset.PantsAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_66,
  },
  [Asset.JacketAccessory]: {
    asset: Asset.JacketAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_67,
  },
  [Asset.SweaterAccessory]: {
    asset: Asset.SweaterAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_68,
  },
  [Asset.ShortsAccessory]: {
    asset: Asset.ShortsAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_69,
  },
  [Asset.DressSkirtAccessory]: {
    asset: Asset.DressSkirtAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_72,
  },
  [Asset.EmoteAnimation]: {
    asset: Asset.EmoteAnimation,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_61,
  },
  [Asset.AllCatalogAsset]: {
    asset: Asset.AllCatalogAsset,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0,
  },
  [Asset.Decal]: { asset: Asset.Decal, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_13 },
  [Asset.Image]: { asset: Asset.Image, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_1 },
  [Asset.Audio]: { asset: Asset.Audio, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_3 },
  [Asset.Model]: { asset: Asset.Model, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_10 },
  [Asset.Mesh]: { asset: Asset.Mesh, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_4 },
  [Asset.MeshPart]: { asset: Asset.MeshPart, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_40 },
  [Asset.Plugin]: { asset: Asset.Plugin, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_38 },
  [Asset.Animation]: {
    asset: Asset.Animation,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_24,
  },
  [Asset.Video]: { asset: Asset.Video, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_62 },
  [Asset.FontFamily]: {
    asset: Asset.FontFamily,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_73,
  },
  // TODO StorePreviewVideo and GamePreviewVideo are not in grasshopper yet, so we're using 0 for now
  [Asset.StorePreviewVideo]: {
    asset: Asset.StorePreviewVideo,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0,
  },
  [Asset.GamePreviewVideo]: {
    asset: Asset.GamePreviewVideo,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0,
  },
  [Asset.MyExperiences]: {
    asset: Asset.MyExperiences,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0,
  },
  [Asset.SharedExperiences]: {
    asset: Asset.SharedExperiences,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0,
  },
  [Asset.ShareLink]: { asset: Asset.ShareLink, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0 },
  [Asset.Event]: { asset: Asset.Event, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0 },
  [Asset.UpcomingEvent]: {
    asset: Asset.UpcomingEvent,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0,
  },
  [Asset.DraftEvent]: {
    asset: Asset.DraftEvent,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0,
  },
  [Asset.PastEvent]: { asset: Asset.PastEvent, apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0 },
  [Asset.EyebrowAccessory]: {
    asset: Asset.EyebrowAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_76,
  },
  [Asset.EyelashAccessory]: {
    asset: Asset.EyelashAccessory,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_77,
  },
  [Asset.FaceMakeup]: {
    asset: Asset.FaceMakeup,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_88,
  },
  [Asset.LipMakeup]: {
    asset: Asset.LipMakeup,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_89,
  },
  [Asset.EyeMakeup]: {
    asset: Asset.EyeMakeup,
    apiType: V1ItemsByCreatorGetAssetTypeEnum.NUMBER_90,
  },
};

export const translateAssetType = (assetType: Asset): V1ItemsByCreatorGetAssetTypeEnum => {
  return ASSET_TYPE_MAPPING[assetType]?.apiType ?? V1ItemsByCreatorGetAssetTypeEnum.NUMBER_0;
};

export const translateAssetTypeToAsset = (
  assetType: RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
): Asset | undefined => {
  const mapping = Object.values(ASSET_TYPE_MAPPING).find((m) => m.apiType === assetType);
  return mapping?.asset;
};

export const translateBundleDetailsTypeToBundleType = (
  bundleType: RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
): BundleType => {
  switch (bundleType) {
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_0:
      return BundleType.Unknown;
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_1:
      return BundleType.Body;
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_2:
      return BundleType.DynamicHead;
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_3:
      return BundleType.Shoes;
    default:
      return BundleType.Unknown;
  }
};

export const translateBundleInfoTypeToBundleType = (
  bundleType: RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
): BundleType => {
  switch (bundleType) {
    case RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.Unknown:
      return BundleType.Unknown;
    case RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.Body:
      return BundleType.Body;
    case RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.DynamicHead:
      return BundleType.DynamicHead;
    case RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.Shoes:
      return BundleType.Shoes;
    default:
      return BundleType.Unknown;
  }
};

export const translateBundleDetailsToBundleInfoType = (
  bundleType: RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
): RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum => {
  switch (bundleType) {
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_0:
      return RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.Unknown;
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_1:
      return RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.Body;
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_2:
      return RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.DynamicHead;
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_3:
      return RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.Shoes;
    default:
      return RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum.Unknown;
  }
};

export const getBundleTypeToBundleTypeString = (bundleType: string): BundleType => {
  switch (bundleType) {
    case 'Body':
      return BundleType.Body;
    case 'DynamicHead':
      return BundleType.DynamicHead;
    case 'Shoes':
      return BundleType.Shoes;
    default:
      return BundleType.Unknown;
  }
};

export const translateBundleTypeToBundleTypeString = (bundleType: BundleType): string => {
  switch (bundleType) {
    case BundleType.Body:
      return 'Body';
    case BundleType.DynamicHead:
      return 'DynamicHead';
    case BundleType.Shoes:
      return 'Shoes';
    default:
      return 'Unknown';
  }
};

export function getIsDurableType(
  assetType: Asset | RobloxItemConfigurationApiAssetDetailsAssetTypeEnum | undefined,
  bundleType:
    | BundleType
    | RobloxItemConfigurationApiBundleDetailsBundleTypeEnum
    | RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum
    | undefined,
) {
  if (assetType !== undefined) {
    if (typeof assetType === 'number') {
      const asset = translateAssetTypeToAsset(assetType);
      if (asset) {
        return ValidWearTimeAssetTypes.includes(asset);
      }
      return false;
    }
    return ValidWearTimeAssetTypes.includes(assetType);
  }

  if (bundleType !== undefined) {
    if (bundleType in RobloxItemConfigurationApiBundleDetailsBundleTypeEnum) {
      const bundle = translateBundleDetailsTypeToBundleType(
        bundleType as RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
      );
      return ValidWearTimeBundleTypes.includes(bundle);
    }
    if (bundleType in RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum) {
      const bundle = translateBundleInfoTypeToBundleType(
        bundleType as RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
      );
      return ValidWearTimeBundleTypes.includes(bundle);
    }
    return ValidWearTimeBundleTypes.includes(bundleType as BundleType);
  }
  return false;
}

export function getIsRentableType(
  assetType: Asset | RobloxItemConfigurationApiAssetDetailsAssetTypeEnum | undefined,
  bundleType:
    | BundleType
    | RobloxItemConfigurationApiBundleDetailsBundleTypeEnum
    | RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum
    | undefined,
) {
  if (assetType !== undefined) {
    if (typeof assetType === 'number') {
      const asset = translateAssetTypeToAsset(assetType);
      if (asset) {
        return ValidTimedOptionsAssetTypes.includes(asset);
      }
      return false;
    }
    return ValidTimedOptionsAssetTypes.includes(assetType);
  }

  if (bundleType !== undefined) {
    if (bundleType in RobloxItemConfigurationApiBundleDetailsBundleTypeEnum) {
      const bundle = translateBundleDetailsTypeToBundleType(
        bundleType as RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
      );
      return ValidTimedOptionsBundleTypes.includes(bundle);
    }
    if (bundleType in RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum) {
      const bundle = translateBundleInfoTypeToBundleType(
        bundleType as RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
      );
      return ValidTimedOptionsBundleTypes.includes(bundle);
    }
    return ValidTimedOptionsBundleTypes.includes(bundleType as BundleType);
  }
  return false;
}

export function itemTypeStringToLabelKey(itemType: string): string {
  switch (itemType) {
    case Asset.TShirt:
      return 'Label.ClassicTShirts';
    case Asset.Shirt:
      return 'Label.ClassicShirts';
    case Asset.Pants:
      return 'Label.ClassicPants';
    default:
      return `Label.${itemType}`;
  }
}

/**
 * Returns the Taxonomy namespace translation key for a given canonical name
 * (e.g. "T-Shirt" -> "Label.TaxonomyTShirt"). Strips non-alphanumeric characters.
 */
export function getTaxonomyTranslationKey(canonicalName: string): string {
  const alphanumericName = canonicalName.replaceAll(/[^a-zA-Z0-9]/g, '');
  return `Label.Taxonomy${alphanumericName}`;
}

/**
 * Returns the display name for a taxonomy: translates the taxonomy key, or falls back
 * to the original taxonomy name if the translation is null or empty.
 */
export function getTaxonomyDisplayName(
  taxonomyName: string,
  translate: (key: string) => string | null | undefined,
): string {
  const key = getTaxonomyTranslationKey(taxonomyName);
  const translated = translate(key);
  if (translated == null || translated === '') {
    return taxonomyName;
  }
  return translated;
}
