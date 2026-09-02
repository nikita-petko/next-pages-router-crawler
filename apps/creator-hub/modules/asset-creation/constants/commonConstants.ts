import { Asset } from '@modules/miscellaneous/common';

export const fileTypeToMimeTypes: { [key in string]: string[] } = {
  mp3: ['audio/mpeg'],
  jpg: ['image/jpg', 'image/jpeg'],
  tga: ['image/targa', 'image/tga', 'image/x-targa', 'image/x-tga'],
  ogg: ['audio/ogg', 'video/ogg', 'application/ogg'],
  flac: ['audio/flac'],
  wav: ['audio/wav', 'audio/x-wav'],
};

export const assetTypeToMimeCategory: { [key in Asset]?: string } = {
  [Asset.Audio]: 'audio',
  [Asset.Video]: 'video',
  [Asset.Decal]: 'image',
  [Asset.TShirt]: 'image',
  [Asset.Shirt]: 'image',
  [Asset.Pants]: 'image',
  [Asset.AvatarBackground]: 'image',
};

export const assetTypeTypeToNameKeys: { [key in Asset]?: string } = {
  [Asset.Audio]: 'Label.Audio',
  [Asset.Decal]: 'Label.Decal',
  [Asset.TShirt]: 'Label.TShirt',
  [Asset.Shirt]: 'Label.Shirt',
  [Asset.Pants]: 'Label.Pants',
  [Asset.Hat]: 'Label.Hat',
  [Asset.HairAccessory]: 'Label.HairAccessory',
  [Asset.FaceAccessory]: 'Label.FaceAccessory',
  [Asset.NeckAccessory]: 'Label.NeckAccessory',
  [Asset.ShoulderAccessory]: 'Label.ShoulderAccessory',
  [Asset.FrontAccessory]: 'Label.FrontAccessory',
  [Asset.BackAccessory]: 'Label.BackAccessory',
  [Asset.WaistAccessory]: 'Label.WaistAccessory',
  [Asset.TShirtAccessory]: 'Label.TShirtAccessory',
  [Asset.ShirtAccessory]: 'Label.ShirtAccessory',
  [Asset.PantsAccessory]: 'Label.PantsAccessory',
  [Asset.JacketAccessory]: 'Label.JacketAccessory',
  [Asset.SweaterAccessory]: 'Label.SweaterAccessory',
  [Asset.ShortsAccessory]: 'Label.ShortsAccessory',
  [Asset.DressSkirtAccessory]: 'Label.DressSkirtAccessory',
};

export const imagePreviewRequiredAssetTypes: Set<Asset> = new Set<Asset>([
  Asset.Decal,
  Asset.TShirt,
  Asset.Shirt,
  Asset.Pants,
  Asset.AvatarBackground,
]);

export const assetUploadOperationStatusPollingIntervalMs = 1000;
export const assetUploadOperationStatusPollingMaxRetries = 11;
// Base of the exponential backoff between consecutive transient poll retries:
// delay = intervalMs * base ** consecutivePollErrors (1s, 2s, 4s ...).
export const assetUploadOperationStatusBackoffBase = 2;
// Number of consecutive transient getOperationStatus failures tolerated (with backoff)
// before the poll gives up and surfaces an error, so a single network/gateway blip does
// not abort an upload that is still succeeding server-side.
export const assetUploadOperationStatusMaxConsecutivePollErrors = 3;
