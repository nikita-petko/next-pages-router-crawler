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

/**
 * Pluggable multipart-video-upload control plane. The default transport talks
 * directly to the public assets-upload-api; the internal transport proxies the
 * same control plane through ads-management-api (which injects the
 * EnhancedVideoExperience label so INTERNAL ad accounts bypass moderation and
 * the upload fee). The actual chunk bytes are always PUT straight to the
 * presigned S3 URLs returned by the start call, so only these JSON calls differ.
 */
export interface VideoUploadTransport {
  abortMultipartUpload: (operationPath: string) => Promise<unknown>;
  getMultipartVideoUploadOperationData: (
    data: Partial<GetMultipartVideoUploadOperationDataRequest>,
  ) => Promise<GetMultipartVideoUploadOperationDataResponse>;
  getVideoAssetId: (operationPath: string) => Promise<GetVideoAssetIdResponse>;
  markChunkComplete: (operationPath: string, chunkNum: number, eTag: string) => Promise<unknown>;
  markUploadComplete: (operationPath: string) => Promise<unknown>;
}
