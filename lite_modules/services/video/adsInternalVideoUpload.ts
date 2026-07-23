import adsClient from '@clients/ads';
import {
  GetMultipartVideoUploadOperationDataRequest,
  GetMultipartVideoUploadOperationDataResponse,
  GetVideoAssetIdResponse,
  VideoUploadTransport,
} from '@type/fileUpload';

// Internal-only multipart video upload control plane, proxied through
// ads-management-api. These endpoints mirror the public assets-upload-api
// multipart flow, but ads-management-api injects the EnhancedVideoExperience
// InternalCreationContextLabels so uploads by INTERNAL ad accounts bypass
// moderation and the upload fee. Unlike the public assets client (which takes
// the operation resource path as a colon-suffixed URL), the AMA proxy takes the
// operationPath in the request body/query, so this transport is intentionally
// separate from services/video/uploadVideo.ts.
const VIDEO_UPLOAD_BASE = '/v1/videoUpload';

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

// Transport passed to UploadVideo() so the shared orchestration (chunking, md5,
// direct-to-S3 PUT, transcode polling, cancel/abort) drives the AMA proxy.
export const adsInternalVideoTransport: VideoUploadTransport = {
  abortMultipartUpload,
  getMultipartVideoUploadOperationData: startMultipartVideoUpload,
  getVideoAssetId,
  markChunkComplete,
  markUploadComplete,
};
