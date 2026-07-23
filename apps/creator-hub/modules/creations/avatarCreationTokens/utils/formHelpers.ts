import type { AvatarCreationTokenItemType } from '@rbx/client-open-cloud/v2';
import { Asset } from '@modules/miscellaneous/common';
import type {
  AvatarCreationToken,
  AvatarCreationTokenBody,
  AvatarCreationTokenPricingPolicy,
  CreateAvatarCreationTokenParams,
  GetAvatarCreationTokenParams,
  GetPricingPolicyParams,
  UpdateAvatarCreationTokenParams,
} from '@modules/react-query/openCloudAvatarCreationTokens/openCloudAvatarCreationTokensRequests';
import { BundleType } from '../../avatarItem/constants/avatarItemConstants';
import type { TAvatarCreationToken } from '../constants/AvatarCreationTokenConstants';

export type { AvatarCreationTokenItemType };

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

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

type AssetTypeEnum = NonNullable<AvatarCreationTokenItemType['assetType']>;
type BundleTypeEnum = NonNullable<AvatarCreationTokenItemType['bundleType']>;

const ASSET_TO_OC: Partial<Record<Asset, AssetTypeEnum>> = {
  [Asset.Hat]: 'HAT',
  [Asset.HairAccessory]: 'HAIR_ACCESSORY',
  [Asset.FaceAccessory]: 'FACE_ACCESSORY',
  [Asset.NeckAccessory]: 'NECK_ACCESSORY',
  [Asset.ShoulderAccessory]: 'SHOULDER_ACCESSORY',
  [Asset.FrontAccessory]: 'FRONT_ACCESSORY',
  [Asset.BackAccessory]: 'BACK_ACCESSORY',
  [Asset.WaistAccessory]: 'WAIST_ACCESSORY',
  [Asset.TShirtAccessory]: 'TSHIRT_ACCESSORY',
  [Asset.ShirtAccessory]: 'SHIRT_ACCESSORY',
  [Asset.PantsAccessory]: 'PANTS_ACCESSORY',
  [Asset.JacketAccessory]: 'JACKET_ACCESSORY',
  [Asset.SweaterAccessory]: 'SWEATER_ACCESSORY',
  [Asset.ShortsAccessory]: 'SHORTS_ACCESSORY',
  [Asset.DressSkirtAccessory]: 'DRESS_SKIRT_ACCESSORY',
  [Asset.EyebrowAccessory]: 'EYEBROW_ACCESSORY',
  [Asset.EyelashAccessory]: 'EYELASH_ACCESSORY',
  [Asset.FaceMakeup]: 'FACE_MAKEUP',
  [Asset.LipMakeup]: 'LIP_MAKEUP',
  [Asset.EyeMakeup]: 'EYE_MAKEUP',
};

const BUNDLE_TO_OC: Partial<Record<BundleType, BundleTypeEnum>> = {
  // TODO @mryumae/@alanzhang: Add shoes here once supported in open cloud
  [BundleType.Body]: 'BODY',
};

const OC_TO_ASSET: Partial<Record<AssetTypeEnum, Asset>> = Object.fromEntries(
  Object.entries(ASSET_TO_OC).map(([asset, oc]) => [
    oc,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `Asset` is a string enum so the entry key is by construction an Asset member value
    asset as Asset,
  ]),
);

const OC_TO_BUNDLE: Partial<Record<BundleTypeEnum, BundleType>> = Object.fromEntries(
  // `BundleType` is a numeric enum, so `Object.entries` stringifies the key —
  // coerce back to a number so `OC_TO_BUNDLE['BODY']` returns `BundleType.Body`
  // (`1`) and not the string `'1'`.
  Object.entries(BUNDLE_TO_OC).map(([bundle, oc]) => [oc, Number(bundle) as BundleType]),
);

function isBundleType(itemType: Asset | BundleType): itemType is BundleType {
  return typeof itemType === 'number';
}

export function getOcItemType(itemType: Asset | BundleType): AvatarCreationTokenItemType {
  if (isBundleType(itemType)) {
    const bundleType = BUNDLE_TO_OC[itemType];
    return bundleType !== undefined ? { bundleType } : {};
  }
  const assetType = ASSET_TO_OC[itemType];
  return assetType !== undefined ? { assetType } : {};
}

export function getEnabledItemType(itemType: AvatarCreationTokenItemType): Asset | BundleType {
  if (itemType.bundleType !== undefined) {
    return OC_TO_BUNDLE[itemType.bundleType] ?? BundleType.Body;
  }
  if (itemType.assetType !== undefined) {
    return OC_TO_ASSET[itemType.assetType] ?? Asset.Hat;
  }
  throw new TypeError('Invalid item type');
}

export async function MakeCreateAvatarCreationTokenRequest(
  data: TAvatarCreationToken,
  pricingPolicy: AvatarCreationTokenPricingPolicy,
  experienceId: string,
  userId: string,
  groupId: number | undefined,
  idempotencyKey: string,
): Promise<CreateAvatarCreationTokenParams> {
  const path = `universes/${experienceId}/avatar-creation-tokens`;
  if (data.displayInformation.itemType === null) {
    throw new TypeError('itemType is required to create an avatar creation token');
  }
  const avatarCreationToken: AvatarCreationTokenBody = {
    path,
    displayName: data.displayInformation.name,
    description: data.displayInformation.description,
    itemType: getOcItemType(data.displayInformation.itemType),
    dynamicPrice: {
      // `||` (not `??`) defaults to 1 when the user submits 0 or clears the
      // field as well — the server rejects MinimumPriceRobux <= 0, treating 0
      // as "free" rather than "unspecified".
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional: also coalesce 0 to 1
      minimumPriceRobux: data.saleInformation.minimumPrice || 1,
      priceOffsetRobux: data.saleInformation.priceOffset,
    },
    expectedCreationCosts: {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- pricing policy is server-fetched and always present at submit time
      creationFeeRobux: pricingPolicy.creationCosts?.creationFeeRobux as number,
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- pricing policy is server-fetched and always present at submit time
      creationAdvanceRobux: pricingPolicy.creationCosts?.creationAdvanceRobux as number,
    },
  };

  if (groupId === undefined) {
    avatarCreationToken.user = `users/${userId}`;
  } else {
    avatarCreationToken.group = `groups/${groupId}`;
  }

  return {
    universeId: experienceId,
    avatarCreationToken,
    idempotencyKey,
  };
}

export function ConvertOcToTokenData(token: AvatarCreationToken): TAvatarCreationToken {
  if (!token.itemType) {
    throw new TypeError('AvatarCreationToken.itemType is missing');
  }
  return {
    displayInformation: {
      name: token.displayName ?? '',
      description: token.description ?? '',
      itemType: getEnabledItemType(token.itemType),
    },
    saleInformation: {
      priceOffset: token.dynamicPrice?.priceOffsetRobux ?? 0,
      minimumPrice: token.dynamicPrice?.minimumPriceRobux ?? 0,
    },
  };
}

export function MakeGetTokenDetailsRequest(
  universeId: string,
  tokenId: string,
): GetAvatarCreationTokenParams {
  return { universeId, avatarCreationTokenId: tokenId };
}

export function MakeUpdateAvatarCreationTokenRequest(
  experienceId: string,
  tokenId: string,
  data: TAvatarCreationToken,
): UpdateAvatarCreationTokenParams {
  const path = `universes/${experienceId}/avatar-creation-tokens/${tokenId}`;
  if (data.displayInformation.itemType === null) {
    throw new TypeError('itemType is required to update an avatar creation token');
  }
  const avatarCreationToken: AvatarCreationTokenBody = {
    path,
    displayName: data.displayInformation.name,
    description: data.displayInformation.description,
    itemType: getOcItemType(data.displayInformation.itemType),
    dynamicPrice: {
      // See comment on create path: `||` defaults to 1 even for an explicit 0.
      // oxlint-disable-next-line typescript/prefer-nullish-coalescing -- intentional: also coalesce 0 to 1
      minimumPriceRobux: data.saleInformation.minimumPrice || 1,
      priceOffsetRobux: data.saleInformation.priceOffset,
    },
  };

  return {
    universeId: experienceId,
    avatarCreationTokenId: tokenId,
    avatarCreationToken,
  };
}

export function MakeGetPricingPolicyRequest(experienceId: string): GetPricingPolicyParams {
  return { universeId: experienceId };
}
