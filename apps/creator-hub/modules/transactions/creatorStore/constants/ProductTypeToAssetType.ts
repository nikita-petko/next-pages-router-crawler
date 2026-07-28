import { RobloxMarketplaceFiatSharedV1Beta1ProductType as ProductType } from '@rbx/client-marketplace-fiat-service/v1';
import { Asset } from '@modules/miscellaneous/common';

export const ProductTypeToAssetType = new Map<ProductType, Asset>([
  [ProductType.Audio, Asset.Audio],
  [ProductType.Decal, Asset.Decal],
  [ProductType.FontFamily, Asset.FontFamily],
  [ProductType.MeshPart, Asset.MeshPart],
  [ProductType.Model, Asset.Model],
  [ProductType.Plugin, Asset.Plugin],
  [ProductType.Video, Asset.Video],
]);
