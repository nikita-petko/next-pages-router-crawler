import {
  AccessStatus as AccessPermissionsStatus,
  AssetType as AssetPermissionsType,
} from '@rbx/clients/assetPermissionsApi';

export enum OptionalDependencyAttribute {
  AccessStatus,
  AssetType,
  Creator,
}

export const assetTypeToTranslationKey = (assetType: AssetPermissionsType) => {
  switch (assetType) {
    case AssetPermissionsType.Animation:
      return 'Label.Animation';
    case AssetPermissionsType.Audio:
      return 'Label.Audio';
    case AssetPermissionsType.Decal:
      return 'Label.Decal';
    case AssetPermissionsType.Image:
      return 'Label.Image';
    case AssetPermissionsType.Mesh:
      return 'Label.Mesh';
    case AssetPermissionsType.MeshPart:
      return 'Label.MeshPart';
    case AssetPermissionsType.Model:
      return 'Label.Model';
    case AssetPermissionsType.TexturePack:
      return 'Label.TexturePack';
    case AssetPermissionsType.Plugin:
      return 'Label.Plugin';
    case AssetPermissionsType.Video:
      return 'Label.Video';
    default:
      return null;
  }
};

export const accessStatusToTranslationKey = (accessStatus: AccessPermissionsStatus) => {
  switch (accessStatus) {
    case AccessPermissionsStatus.OpenUse:
      return 'Label.OpenUse';
    case AccessPermissionsStatus.Restricted:
      return 'Label.Restricted';
    default:
      return null;
  }
};
