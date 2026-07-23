import type { ChangeEvent } from 'react';
import { AssetType } from '@rbx/client-assets-upload-api/v1';
import type { CreationContext } from '@modules/clients/assetsupload';
import { Asset } from '@modules/miscellaneous/common';
import { creatorHub } from '@modules/miscellaneous/urls';

const { docs } = creatorHub;
export const dashboardAssetTypeToOpenCloudAssetType: { [key in Asset]?: AssetType } = {
  [Asset.Decal]: AssetType.Decal,
  [Asset.Audio]: AssetType.Audio,
  [Asset.Video]: AssetType.Video,
  [Asset.TShirt]: AssetType.Tshirt,
  [Asset.Shirt]: AssetType.Shirt,
  [Asset.Pants]: AssetType.Pants,
  [Asset.AvatarBackground]: AssetType.AvatarBackground,
};

export const assetTypeInfoTextMessage: { [key in Asset]?: string | null } = {
  [Asset.Decal]: 'Message.DecalResolutionLimits',
  [Asset.Audio]: 'Message.AudioLimits',
  [Asset.AvatarBackground]: 'Message.AvatarBackgroundUploadRequirements',
};

export const maxFileSizeMB = (asset: Asset) => {
  // eslint-disable-next-line typescript/switch-exhaustiveness-check -- intentional default fallback for unhandled asset types
  switch (asset) {
    case Asset.Decal:
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
    case Asset.Audio:
    case Asset.AvatarBackground:
      return 20;
    case Asset.Video:
      return 30;
    default:
      return 0;
  }
};

export const maxDurationInSeconds = (asset: Asset) => {
  // eslint-disable-next-line typescript/switch-exhaustiveness-check -- intentional default fallback for unhandled asset types
  switch (asset) {
    case Asset.Video:
      return 300;
    default:
      return null;
  }
};

export const maxResolution = (asset: Asset) => {
  // eslint-disable-next-line typescript/switch-exhaustiveness-check -- intentional default fallback for unhandled asset types
  switch (asset) {
    case Asset.Video:
      return '4096x2160';
    default:
      return null;
  }
};

export const allowedAssetTypeFormats = (asset: Asset) => {
  // eslint-disable-next-line typescript/switch-exhaustiveness-check -- intentional default fallback for unhandled asset types
  switch (asset) {
    case Asset.Decal:
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
    case Asset.AvatarBackground:
      return ['jpg', 'png', 'tga', 'bmp'];
    case Asset.Audio:
      return ['mp3', 'ogg', 'flac', 'wav'];
    case Asset.Video:
      return ['mp4', 'mov'];
    default:
      return [];
  }
};

export const getInfoUrl = (asset: Asset) => {
  // eslint-disable-next-line typescript/switch-exhaustiveness-check -- intentional default fallback for unhandled asset types
  switch (asset) {
    case Asset.Decal:
      return docs.getDecalReferenceUrl();
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
      return docs.getClassicClothingUrl();
    case Asset.Audio:
      return docs.getAudioAssetsUrl();
    case Asset.Video:
      // NOTE(nkachkovsky, 07/27/2023): No video specific doc page; using generic assets doc page for now
      return docs.getAssetsUrl();
    case Asset.AvatarBackground:
      return docs.getAvatarItemsUrl();
    default:
      return '';
  }
};

export const isCreateAssetAvailable = (asset: Asset) => {
  const isCatalogEnabled = process.env.buildTarget !== 'luobu';
  // eslint-disable-next-line typescript/switch-exhaustiveness-check -- intentional default fallback for unhandled asset types
  switch (asset) {
    case Asset.Audio:
    case Asset.Decal:
    case Asset.Video:
      return true;
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
    case Asset.AvatarBackground:
      return isCatalogEnabled;
    default:
      return false;
  }
};

export const is2DAsset = (asset: Asset) => {
  // eslint-disable-next-line typescript/switch-exhaustiveness-check -- intentional default fallback for unhandled asset types
  switch (asset) {
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
      return true;
    default:
      return false;
  }
};

export const purchasableAssetTypes = [
  Asset.Shirt,
  Asset.Pants,
  Asset.Video,
  Asset.TShirt,
  Asset.AvatarBackground,
];

export const quotaEnabledAssetTypes = [Asset.Audio, Asset.Video];

export type AssetTypeSelectionInputs = {
  assetType: Asset;
  handleAssetTypeChange: (arg: ChangeEvent<unknown>) => void;
};

export type AssetFileInputs = {
  assetType: Asset;
  handleFileChange: (arg: File | null) => void;
};

export type CreateAssetFormProps = {
  assetType: Asset;
};

export type AssetUploadProps = {
  targetType: string;
  file: File;
  creationContext: CreationContext;
};
