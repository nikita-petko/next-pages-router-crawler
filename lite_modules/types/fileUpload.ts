export interface CancelImageUpload {
  [key: string]: () => void;
}

export interface AspectRatioValidation {
  /** Allowed aspect ratios in format [width, height] */
  allowedRatios: Array<[number, number]>;
  /** Tolerance for aspect ratio matching (default: 0.05 = 5%) */
  tolerance?: number;
}

export interface SetUploadedImageParams {
  aspectRatio?: string;
  assetId: number;
  blob: Blob;
  image: File;
}

export enum VideoUploadState {
  ERROR = 'error',
  FINISHED = 'finished',
  STAGED = 'staged',
  UPLOADING = 'uploading',
}

export type UploadedVideoType = {
  assetId?: string;
  cancelCb?: () => void;
  duration?: number;
  error?: string;
  file: File | Blob;
  height?: number;
  id: string;
  progress: number;
  state: VideoUploadState;
  width?: number;
};

export interface GetMultipartVideoUploadOperationDataRequest {
  asset: {
    assetType: string;
    creationContext: {
      creator: {
        userId?: number;
      };
      expectedPrice: number;
    };
    description: string;
    displayName: string;
  };
  file: {
    chunkPlan: number[];
    contentType: string;
    filesize: number;
    md5CheckSum: string;
  };
}

export interface GetMultipartVideoUploadOperationDataResponse {
  operationPath: string;
  uploadUrls: Array<{ chunkNum: number; url: string }>;
}

export interface GetVideoAssetIdResponse {
  done: boolean;
  metadata: {
    progress?: number;
  };
  response: {
    assetId?: number;
  };
}
