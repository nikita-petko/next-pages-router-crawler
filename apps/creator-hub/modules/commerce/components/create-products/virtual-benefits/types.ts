export enum ErrorStates {
  NotFound = 'NOT_FOUND',
  Unauthorized = 'UNAUTHORIZED',
  HasBeenOnSale = 'HAS_BEEN_ON_SALE',
  UnknownError = 'UNKNOWN_ERROR',
  Moderated = 'MODERATED',
  ImageUploadFailed = 'IMAGE_UPLOAD_FAILED',
}

export interface AssetDetails {
  assetId: string;
  name: string;
  description: string;
}

export type VirtualBenefitFormType = {
  name: string;
  description: string;
  grantableType: string;
  grantableAssetId: string;
  developerProductId: number;
  imageAssetId: number;
};

export const VirtualBenefitRegisterOptions = {
  name: {
    required: 'Error.Required',
    maxLength: 50,
  },
  description: {
    maxLength: 1000,
  },
};
