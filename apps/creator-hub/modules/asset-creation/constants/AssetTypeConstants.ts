import { AssetType } from '@rbx/clients/assetsUploadApi';
import { ChangeEvent } from 'react';
import { CreationContext } from '@modules/clients/assetsupload';
import { Asset, urls } from '@modules/miscellaneous/common';

const {
  creatorHub: { docs },
} = urls;
export const dashboardAssetTypeToOpenCloudAssetType: { [key in Asset]?: AssetType } = {
  [Asset.Decal]: AssetType.Decal,
  [Asset.Audio]: AssetType.Audio,
  [Asset.Video]: AssetType.Video,
  [Asset.TShirt]: AssetType.Tshirt,
  [Asset.Shirt]: AssetType.Shirt,
  [Asset.Pants]: AssetType.Pants,
};

export const assetTypeInfoTextMessage: { [key in Asset]?: string | null } = {
  [Asset.Decal]: 'Message.DecalResolutionLimits',
  [Asset.Audio]: 'Message.AudioLimits',
};

export const maxFileSizeMB = (asset: Asset) => {
  switch (asset) {
    case Asset.Decal:
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
    case Asset.Audio:
      return 20;
    case Asset.Video:
      return 30;
    default:
      return 0;
  }
};

export const maxDurationInSeconds = (asset: Asset) => {
  switch (asset) {
    case Asset.Video:
      return 300;
    default:
      return null;
  }
};

export const maxResolution = (asset: Asset) => {
  switch (asset) {
    case Asset.Video:
      return '4096x2160';
    default:
      return null;
  }
};

export const allowedAssetTypeFormats = (asset: Asset) => {
  switch (asset) {
    case Asset.Decal:
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
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
    default:
      return '';
  }
};

export const isCreateAssetAvailable = (asset: Asset) => {
  const isCatalogEnabled = process.env.buildTarget !== 'luobu';
  switch (asset) {
    case Asset.Audio:
    case Asset.Decal:
    case Asset.Video:
      return true;
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
      return isCatalogEnabled;
    default:
      return false;
  }
};

export const is2DAsset = (asset: Asset) => {
  switch (asset) {
    case Asset.TShirt:
    case Asset.Shirt:
    case Asset.Pants:
      return true;
    default:
      return false;
  }
};

export const purchasableAssetTypes = [Asset.Shirt, Asset.Pants, Asset.Video, Asset.TShirt];

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
