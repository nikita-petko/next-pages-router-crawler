import adsClient from '@clients/ads';
import {
  GetMultipartVideoUploadOperationDataRequest,
  GetMultipartVideoUploadOperationDataResponse,
  GetVideoAssetIdResponse,
  VideoUploadTransport,
} from '@type/fileUpload';

// Internal-only video upload flow proxied through ads-management-api. Raw
// uploads use assets-upload-api's direct UploadOperation path so AssetPrivacy
// and the EnhancedVideoExperience label are applied to the created asset.
const VIDEO_UPLOAD_BASE = '/v1/videoUpload';

const uploadVideo = async (video: File, abortSignal?: AbortSignal) => {
  const body = new FormData();
  body.append('fileContent', video, video.name);

  const response = await adsClient.post<{ path: string }>({
    abortSignal,
    body,
    headers: { 'Content-Type': 'multipart/form-data' },
    url: `${VIDEO_UPLOAD_BASE}/raw`,
  });
  return { operationPath: response.data.path };
};

const startMultipartVideoUpload = async (
  data: Partial<GetMultipartVideoUploadOperationDataRequest>,
) => {
  const response = await adsClient.post<GetMultipartVideoUploadOperationDataResponse>({
    body: data,
    url: `${VIDEO_UPLOAD_BASE}/start`,
  });
  return response.data;
};

const markChunkComplete = async (operationPath: string, chunkNum: number, eTag: string) => {
  const response = await adsClient.post({
    body: { chunkNum, eTag, operationPath },
    url: `${VIDEO_UPLOAD_BASE}/chunkComplete`,
  });
  return response.data;
};

const markUploadComplete = async (operationPath: string) => {
  const response = await adsClient.post({
    body: { operationPath },
    url: `${VIDEO_UPLOAD_BASE}/complete`,
  });
  return response.data;
};

const getVideoAssetId = async (operationPath: string) => {
  const response = await adsClient.get<GetVideoAssetIdResponse>({
    url: `${VIDEO_UPLOAD_BASE}/status?operationPath=${encodeURIComponent(operationPath)}`,
  });
  return response.data;
};

const abortMultipartUpload = async (operationPath: string) => {
  const response = await adsClient.delete({
    body: { operationPath },
    url: `${VIDEO_UPLOAD_BASE}/abort`,
  });
  return response.data;
};

// The multipart methods remain available for the existing control-plane
// endpoints, while UploadVideo uses uploadVideo when it is present.
export const adsInternalVideoTransport: VideoUploadTransport = {
  abortMultipartUpload,
  getMultipartVideoUploadOperationData: startMultipartVideoUpload,
  getVideoAssetId,
  markChunkComplete,
  markUploadComplete,
  uploadVideo,
};
