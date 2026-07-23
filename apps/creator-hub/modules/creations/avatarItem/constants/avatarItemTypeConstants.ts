import { Asset } from '@modules/miscellaneous/common';

const avatar3DAssetTypes = [
  Asset.Hat,
  Asset.HairAccessory,
  Asset.FaceAccessory,
  Asset.NeckAccessory,
  Asset.ShoulderAccessory,
  Asset.FrontAccessory,
  Asset.BackAccessory,
  Asset.WaistAccessory,
  Asset.TShirtAccessory,
  Asset.ShirtAccessory,
  Asset.PantsAccessory,
  Asset.JacketAccessory,
  Asset.SweaterAccessory,
  Asset.ShortsAccessory,
  Asset.DressSkirtAccessory,
  Asset.EyebrowAccessory,
  Asset.EyelashAccessory,
];

const avatar2DAssetTypes = [Asset.TShirt, Asset.Shirt, Asset.Pants];

const avatarAnimationAssetTypes = [Asset.EmoteAnimation];

const avatarMakeupAssetTypes = [Asset.FaceMakeup, Asset.LipMakeup, Asset.EyeMakeup];

const avatarItemTypeConstants = {
  avatar3DAssetTypes,
  avatar2DAssetTypes,
  avatarAnimationAssetTypes,
  avatarMakeupAssetTypes,
  avatarAssetTypes: [
    ...avatar3DAssetTypes,
    ...avatar2DAssetTypes,
    ...avatarAnimationAssetTypes,
    ...avatarMakeupAssetTypes,
  ],
};

export default avatarItemTypeConstants;
