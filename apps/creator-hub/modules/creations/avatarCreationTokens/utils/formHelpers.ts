import { V2CloudProtos, v2Protos } from '@rbx/open-cloud';
import { Asset } from '@modules/miscellaneous/common';
import { TAvatarCreationToken } from '../constants/AvatarCreationTokenConstants';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';

export const nameMaxLength = 50;
export const descriptionMaxLength = 1000;

export function validateForm(form: TAvatarCreationToken): boolean {
  if (
    form.displayInformation.name.length > nameMaxLength ||
    form.displayInformation.name.length === 0 ||
    form.displayInformation.description.length > descriptionMaxLength ||
    form.displayInformation.description.length === 0
  ) {
    return false;
  }

  if (form.displayInformation.itemType === null) {
    return false;
  }

  return true;
}

/// function to return after waiting for 2 seconds
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getOcItemType(itemType: Asset | BundleType) {
  if (Object.values(BundleType).includes(itemType as BundleType)) {
    switch (itemType as BundleType) {
      // TODO @mryumae/@alanzhang: Add shoes here once supported in open cloud
      case BundleType.Body:
        return new V2CloudProtos.AvatarCreationToken.ItemType({
          bundleType: V2CloudProtos.AvatarCreationToken.BundleType.BODY,
        });
      default:
        return new V2CloudProtos.AvatarCreationToken.ItemType({});
    }
  } else {
    let assetType: V2CloudProtos.AvatarCreationToken.AssetType;
    switch (itemType as Asset) {
      case Asset.Hat:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.HAT;
        break;
      case Asset.HairAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.HAIR_ACCESSORY;
        break;
      case Asset.FaceAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.FACE_ACCESSORY;
        break;
      case Asset.NeckAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.NECK_ACCESSORY;
        break;
      case Asset.ShoulderAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.SHOULDER_ACCESSORY;
        break;
      case Asset.FrontAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.FRONT_ACCESSORY;
        break;
      case Asset.BackAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.BACK_ACCESSORY;
        break;
      case Asset.WaistAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.WAIST_ACCESSORY;
        break;
      case Asset.TShirtAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.TSHIRT_ACCESSORY;
        break;
      case Asset.ShirtAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.SHIRT_ACCESSORY;
        break;
      case Asset.PantsAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.PANTS_ACCESSORY;
        break;
      case Asset.JacketAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.JACKET_ACCESSORY;
        break;
      case Asset.SweaterAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.SWEATER_ACCESSORY;
        break;
      case Asset.ShortsAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.SHORTS_ACCESSORY;
        break;
      case Asset.DressSkirtAccessory:
        assetType = V2CloudProtos.AvatarCreationToken.AssetType.DRESS_SKIRT_ACCESSORY;
        break;
      default:
        return new V2CloudProtos.AvatarCreationToken.ItemType({});
    }
    return new V2CloudProtos.AvatarCreationToken.ItemType({
      assetType,
    });
  }
}

export async function MakeCreateAvatarCreationTokenRequest(
  data: TAvatarCreationToken,
  pricingPolicy: V2CloudProtos.AvatarCreationToken.IPricingPolicy,
  experienceId: string,
  userId: string,
  groupId: number | undefined,
  idempotencyKey: string,
) {
  const path = `universes/${experienceId}/avatar-creation-tokens`;
  const avatarCreationToken: V2CloudProtos.IAvatarCreationToken = {
    path,
    displayName: data.displayInformation.name,
    description: data.displayInformation.description,
    itemType: getOcItemType(data.displayInformation.itemType!),
    dynamicPrice: new V2CloudProtos.AvatarCreationToken.DynamicPrice({
      minimumPriceRobux: data.saleInformation.minimumPrice ?? 1, // Default to 1, since 0 indicates free.
      priceOffsetRobux: data.saleInformation.priceOffset,
    }),
    expectedCreationCosts: new V2CloudProtos.AvatarCreationToken.CreationCosts({
      creationFeeRobux: pricingPolicy.creationCosts?.creationFeeRobux as number,
      creationAdvanceRobux: pricingPolicy.creationCosts?.creationAdvanceRobux as number,
    }),
  };

  if (groupId === undefined) {
    avatarCreationToken.user = `users/${userId}`;
  } else {
    avatarCreationToken.group = `groups/${groupId}`;
  }

  const key = new v2Protos.aep.api.IdempotencyKey({ key: idempotencyKey });
  const request: V2CloudProtos.ICreateAvatarCreationTokenRequest = {
    parent: `universes/${experienceId}`,
    avatarCreationToken,
    idempotencyKey: key,
  };
  return request;
}

// Used to translate bundle type from oc to ICA
export function getEnabledItemType(
  itemType: V2CloudProtos.AvatarCreationToken.IItemType,
): Asset | BundleType {
  if (itemType.bundleType !== undefined) {
    // TODO @mryumae/@alanzhang: Add shoes here once supported in open cloud
    switch (itemType.bundleType) {
      case 'BODY':
        return BundleType.Body;
      default:
        return BundleType.Body;
    }
  } else if (itemType.assetType !== undefined) {
    switch (itemType.assetType) {
      case 'HAT':
        return Asset.Hat;
      case 'HAIR_ACCESSORY':
        return Asset.HairAccessory;
      case 'FACE_ACCESSORY':
        return Asset.FaceAccessory;
      case 'NECK_ACCESSORY':
        return Asset.NeckAccessory;
      case 'SHOULDER_ACCESSORY':
        return Asset.ShoulderAccessory;
      case 'FRONT_ACCESSORY':
        return Asset.FrontAccessory;
      case 'BACK_ACCESSORY':
        return Asset.BackAccessory;
      case 'WAIST_ACCESSORY':
        return Asset.WaistAccessory;
      case 'TSHIRT_ACCESSORY':
        return Asset.TShirtAccessory;
      case 'SHIRT_ACCESSORY':
        return Asset.ShirtAccessory;
      case 'PANTS_ACCESSORY':
        return Asset.PantsAccessory;
      case 'JACKET_ACCESSORY':
        return Asset.JacketAccessory;
      case 'SWEATER_ACCESSORY':
        return Asset.SweaterAccessory;
      case 'SHORTS_ACCESSORY':
        return Asset.ShortsAccessory;
      case 'DRESS_SKIRT_ACCESSORY':
        return Asset.DressSkirtAccessory;
      default:
        return Asset.Hat;
    }
  } else {
    throw new TypeError('Invalid item type');
  }
}

export function ConvertOcToTokenData(
  token: V2CloudProtos.IAvatarCreationToken,
): TAvatarCreationToken {
  return {
    displayInformation: {
      name: token.displayName!,
      description: token.description!,
      itemType: getEnabledItemType(token.itemType!),
    },
    saleInformation: {
      priceOffset: token.dynamicPrice!.priceOffsetRobux as number,
      minimumPrice: token.dynamicPrice!.minimumPriceRobux as number,
    },
  };
}

export function MakeGetTokenDetailsRequest(universeId: string, tokenId: string) {
  const path = `universes/${universeId}/avatar-creation-tokens/${tokenId}`;
  const request: V2CloudProtos.IGetAvatarCreationTokenRequest = {
    path,
  };

  return request;
}

export function MakeUpdateAvatarCreationTokenRequest(
  experienceId: string,
  tokenId: string,
  data: TAvatarCreationToken,
) {
  const path = `universes/${experienceId}/avatar-creation-tokens/${tokenId}`;
  const avatarCreationToken = {
    path,
    displayName: data.displayInformation.name,
    description: data.displayInformation.description,
    itemType: getOcItemType(data.displayInformation.itemType!),
    dynamicPrice: new V2CloudProtos.AvatarCreationToken.DynamicPrice({
      minimumPriceRobux: data.saleInformation.minimumPrice ?? 1, // Default to 1, since 0 indicates free.
      priceOffsetRobux: data.saleInformation.priceOffset ?? 0,
    }),
  };

  const request: V2CloudProtos.IUpdateAvatarCreationTokenRequest = {
    avatarCreationToken,
  };

  return request;
}

export function MakeGetPricingPolicyRequest(experienceId: string) {
  const request: V2CloudProtos.IGetAvatarCreationTokensPricingPolicyRequest = {
    parent: `universes/${experienceId}`,
  };

  return request;
}
