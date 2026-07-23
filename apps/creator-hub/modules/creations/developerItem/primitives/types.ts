import { Asset } from '@modules/miscellaneous/common';

export type PrimitiveAssetType = Asset.Image | Asset.Mesh;
export const isPrimitiveAssetType = (assetType: Asset) =>
  assetType === Asset.Image || assetType === Asset.Mesh;

export type TPrimitiveListItem = {
  assetType: PrimitiveAssetType;
  assetId: number;
  name: string;
  created: Date | null;
  isArchivable: boolean;
  isArchived: boolean;
  isOnMarketplace: boolean;
};
