import { Asset } from '@modules/miscellaneous/common';

const VERSION_HISTORY_ASSETS = [Asset.Animation, Asset.Model, Asset.Plugin, Asset.TextDocument];

// Plugins are not an AAC asset type, despite being quasi-restricted
export const ASSET_ACCESS_FORM_ASSETS = [
  Asset.Animation,
  Asset.Audio,
  Asset.Decal,
  Asset.Image,
  Asset.Mesh,
  Asset.MeshPart,
  Asset.Model,
  Asset.TextDocument,
  Asset.Video,
];

export const DEPENDENCIES_ASSETS = [Asset.Model, Asset.MeshPart];

// TextDocuments have no Creator Store page, so they don't get an "open in marketplace" link.
export const MARKETPLACE_LINK_EXCLUDED_ASSETS = [Asset.TextDocument];

// EDIT permissions are only available for Model/Package collaborators
// Experiences and other asset types only support USE permissions
export const EDIT_PERMISSION_ASSETS = [Asset.Model];

export default VERSION_HISTORY_ASSETS;
