import assetsClient from '@clients/assets';
import {
  GetMultipartVideoUploadOperationDataRequest,
  GetMultipartVideoUploadOperationDataResponse,
  GetVideoAssetIdResponse,
} from '@type/fileUpload';

// http://apis.sitetest1.robloxlabs.com/assets/v1/operations/1623b8da-2464-4dd6-8f5a-818fb904c545:multipartUploadChunkComplete
export const markChunkComplete = async (operationPath: string, chunkNum: number, eTag: string) => {
  const response = await assetsClient.post({
    body: { chunkNum, eTag },
    url: `${operationPath}:multipartUploadChunkComplete`,
  });
  return response.data;
};

// EG https://apis.sitetest1.robloxlabs.com/assets/v1/operations/1623b8da-2464-4dd6-8f5a-818fb904c545:multipartUploadComplete
export const markUploadComplete = async (operationPath: string) => {
  const response = await assetsClient.post({
    body: {},
    url: `${operationPath}:multipartUploadComplete`,
  });
  return response.data;
};

// EG: https://apis.sitetest1.robloxlabs.com/assets/v1/operations/1623b8da-2464-4dd6-8f5a-818fb904c545
export const getVideoAssetId = async (operationPath: string) => {
  const response = await assetsClient.get<GetVideoAssetIdResponse>({
    url: operationPath,
  });
  return response.data;
};

// Abort multipart upload
export const abortMultipartUpload = async (operationPath: string) => {
  const response = await assetsClient.delete({
    url: `${operationPath}:multipartUpload`,
  });
  return response.data;
};

export const getMultipartVideoUploadOperationData = async (
  data: Partial<GetMultipartVideoUploadOperationDataRequest>,
) => {
  const response = await assetsClient.post<GetMultipartVideoUploadOperationDataResponse>({
    body: data,
    url: 'assets:multipartUpload',
  });
  return response.data;
};
