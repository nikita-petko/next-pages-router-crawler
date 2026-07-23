import { Asset } from '@modules/miscellaneous/common';

const VERSION_HISTORY_ASSETS = [Asset.Animation, Asset.Model, Asset.Plugin];

// Plugins are not an AAC asset type, despite being quasi-restricted
export const ASSET_ACCESS_FORM_ASSETS = [
  Asset.Animation,
  Asset.Audio,
  Asset.Decal,
  Asset.Image,
  Asset.Mesh,
  Asset.MeshPart,
  Asset.Model,
  Asset.Video,
];

export const PERMISSION_ASSETS = [
  Asset.Audio,
  Asset.Decal,
  Asset.Image,
  Asset.Mesh,
  Asset.MeshPart,
  Asset.Model,
  Asset.Video,
];

export const PERMISSION_ASSETS_WITH_ANIMATION = [
  Asset.Animation,
  Asset.Audio,
  Asset.Decal,
  Asset.Image,
  Asset.Mesh,
  Asset.MeshPart,
  Asset.Model,
  Asset.Video,
];

// EDIT permissions are only available for Model/Package collaborators
// Experiences and other asset types only support USE permissions
export const EDIT_PERMISSION_ASSETS = [Asset.Model];

export default VERSION_HISTORY_ASSETS;
