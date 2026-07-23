import {
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModelSaleLocationTypeEnum,
  V1PermissionsItemTypesGetTargetTypesEnum,
  V1PermissionsItemTypesGetActionEnum,
} from '@rbx/client-itemconfiguration/v1';
import { Asset } from '@modules/miscellaneous/common';
import { itemconfigurationClient } from '@modules/clients';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';
import { getBundleTypeToBundleTypeString } from './UnifiedFeeSystemHelper';

export enum SaleLocationEnum {
  Invalid = 0,
  MarketplaceAndAllExperiences = 1,
  ExperiencesAndDevAPIOnly = 2,
  MarketplaceOnly = 3,
  MarketplaceAndExperiencesById = 4,
}

export function mapSaleLocationToType(
  saleLocation: SaleLocationEnum,
): RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModelSaleLocationTypeEnum {
  switch (saleLocation) {
    case SaleLocationEnum.MarketplaceAndAllExperiences:
      return RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModelSaleLocationTypeEnum.NUMBER_1;
    case SaleLocationEnum.ExperiencesAndDevAPIOnly:
      return RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModelSaleLocationTypeEnum.NUMBER_2;
    case SaleLocationEnum.MarketplaceOnly:
      return RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModelSaleLocationTypeEnum.NUMBER_3;
    case SaleLocationEnum.MarketplaceAndExperiencesById:
      return RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModelSaleLocationTypeEnum.NUMBER_4;
    default:
      return RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModelSaleLocationTypeEnum.NUMBER_0;
  }
}

export function mapBundleTypeToString(
  bundleType: RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
): string {
  switch (bundleType) {
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_1:
      return 'Body';
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_2:
      return 'DynamicHead';
    case RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_3:
      return 'Shoes';
    default:
      return 'Invalid';
  }
}

// https://github.rbx.com/Roblox/web-platform/blob/master/Assemblies/Platform/Assets/Roblox.Platform.Assets/Enums/AssetType.cs
export function mapAssetTypeToString(
  assetType: RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
): string {
  switch (assetType) {
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_1:
      return Asset.Image.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_2:
      return Asset.TShirt.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_3:
      return Asset.Audio.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_4:
      return Asset.Mesh.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_8:
      return Asset.Hat.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_9:
      return Asset.Place.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_10:
      return Asset.Model.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_11:
      return Asset.Shirt.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_12:
      return Asset.Pants.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_13:
      return Asset.Decal.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_24:
      return Asset.Animation.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_38:
      return Asset.Plugin.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_40:
      return Asset.MeshPart.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_41:
      return Asset.HairAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_42:
      return Asset.FaceAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_43:
      return Asset.NeckAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_44:
      return Asset.ShoulderAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_45:
      return Asset.FrontAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_46:
      return Asset.BackAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_47:
      return Asset.WaistAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_61:
      return Asset.EmoteAnimation.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_62:
      return Asset.Video.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_64:
      return Asset.TShirtAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_65:
      return Asset.ShirtAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_66:
      return Asset.PantsAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_67:
      return Asset.JacketAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_68:
      return Asset.SweaterAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_69:
      return Asset.ShortsAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_72:
      return Asset.DressSkirtAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_73:
      return Asset.FontFamily.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_76:
      return Asset.EyebrowAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_77:
      return Asset.EyelashAccessory.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_88:
      return Asset.FaceMakeup.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_89:
      return Asset.LipMakeup.toString();
    case RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_90:
      return Asset.EyeMakeup.toString();
    default:
      return 'Invalid';
  }
}

export enum Availability {
  NonLimited = 0,
  Limited = 1,
}

export const BodySuitDisplayName = 'Body Suit';

export const PUBLISHING_ADVANCE_THRESHOLD = 0.3;

export const DefaultMaxCollectiblePrice = 999999999;

export enum PurchasePlatformEnum {
  Invalid = 0,
  Marketplace = 1,
  InExperience = 2,
}

export enum DurationOptionsEnum {
  Days3 = 'Days3',
  Days7 = 'Days7',
  Days14 = 'Days14',
  Permanent = 'Permanent',
}

export const DurationOptions = Object.values(DurationOptionsEnum);

export function mapDurationToDays(duration: DurationOptionsEnum): number {
  switch (duration) {
    case DurationOptionsEnum.Permanent:
      return 0;
    case DurationOptionsEnum.Days3:
      return 3;
    case DurationOptionsEnum.Days14:
      return 14;
    case DurationOptionsEnum.Days7:
      return 7;
    default:
      return 0;
  }
}

export function mapDurationToEnum(duration: number): DurationOptionsEnum {
  switch (duration) {
    case 3:
      return DurationOptionsEnum.Days3;
    case 7:
      return DurationOptionsEnum.Days7;
    case 14:
      return DurationOptionsEnum.Days14;
    default:
      return DurationOptionsEnum.Permanent;
  }
}

export function mapDurationToString(wearTime: DurationOptionsEnum): string {
  switch (wearTime) {
    case DurationOptionsEnum.Permanent:
      return 'Permanent';
    case DurationOptionsEnum.Days14:
      return 'Days14';
    case DurationOptionsEnum.Days7:
      return 'Days7';
    case DurationOptionsEnum.Days3:
      return 'Days3';
    default:
      return '';
  }
}

export const ValidWearTimeAssetTypes: Asset[] = [];
export const ValidWearTimeBundleTypes: BundleType[] = [];
export const ValidTimedOptionsAssetTypes: Asset[] = [];
export const ValidTimedOptionsBundleTypes: BundleType[] = [];

export async function getValidWearTimeTypes() {
  // Early out if we already fetched the wear time types
  if (ValidWearTimeAssetTypes.length > 0 && ValidWearTimeBundleTypes.length > 0) {
    return;
  }

  const response = await itemconfigurationClient.getAllowedAssetTypes(
    V1PermissionsItemTypesGetActionEnum.NUMBER_4, // PublishDurable
    [
      V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_0,
      V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_1,
    ], // Fetch for both asset = 0 and bundle = 1
  );

  if (response.allowedAssetTypes) {
    response.allowedAssetTypes.forEach((assetType) => {
      ValidWearTimeAssetTypes.push(assetType as Asset);
    });
  }

  if (response.allowedBundleTypes) {
    response.allowedBundleTypes.forEach((bundleType) => {
      ValidWearTimeBundleTypes.push(getBundleTypeToBundleTypeString(bundleType));
    });
  }
}

export async function getValidTimedOptionsTypes() {
  // Early out if we already fetched the timed option types for rentables
  if (ValidTimedOptionsAssetTypes.length > 0 && ValidTimedOptionsBundleTypes.length > 0) {
    return;
  }

  const response = await itemconfigurationClient.getAllowedAssetTypes(
    V1PermissionsItemTypesGetActionEnum.NUMBER_5, // PublishRentable
    [
      V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_0,
      V1PermissionsItemTypesGetTargetTypesEnum.NUMBER_1,
    ], // Fetch for both asset = 0 and bundle = 1
  );

  if (response.allowedAssetTypes) {
    response.allowedAssetTypes.forEach((assetType) => {
      let parsedAssetType = assetType;
      if (assetType === 'TshirtAccessory') {
        parsedAssetType = 'TShirtAccessory';
      }
      ValidTimedOptionsAssetTypes.push(parsedAssetType as Asset);
    });
  }

  if (response.allowedBundleTypes) {
    response.allowedBundleTypes.forEach((bundleType) => {
      ValidTimedOptionsBundleTypes.push(getBundleTypeToBundleTypeString(bundleType));
    });
  }
}
