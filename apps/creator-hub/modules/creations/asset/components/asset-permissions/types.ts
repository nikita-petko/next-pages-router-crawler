import { Asset } from '@modules/miscellaneous/common';

export const PrivateAssetTypes = new Set<Asset>([
  Asset.Animation,
  Asset.Audio,
  Asset.Video,
  Asset.Model,
  Asset.Mesh,
  Asset.MeshPart,
  Asset.Image,
  Asset.Decal,
]);

export type TAssetDetails = {
  assetId: number;
  name: string;
  assetType: Asset | null;
  creatorName: string;
  alreadyAdded?: boolean;
};
