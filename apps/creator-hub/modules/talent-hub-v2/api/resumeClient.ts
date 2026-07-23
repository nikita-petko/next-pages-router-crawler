import { ResumeStatus } from '@rbx/client-talent-hub-v2-service/v2';
import type { Resume } from '@rbx/client-talent-hub-v2-service/v2';
import type {
  ApiResumeUploadInitResponse,
  ApiResumeConfirmResponse,
  ApiResumeDownloadUrlResponse,
  ApiResumeListResponse,
} from '../types';
import { resumesApi } from './talentHubClient';

function toApiResume(resume: Resume): ApiResumeConfirmResponse {
  const createdAt = resume.createdAt?.toISOString() ?? new Date(0).toISOString();
  const status = (() => {
    switch (resume.status) {
      case ResumeStatus.NUMBER_0:
        return 'pending_upload';
      case ResumeStatus.NUMBER_2:
        return 'deleted';
      case ResumeStatus.NUMBER_1:
      default:
        return 'active';
    }
  })();
  return {
    id: resume.id ?? '',
    userId: resume.userId ?? 0,
    fileName: resume.fileName ?? '',
    contentType: resume.contentType ?? 'application/pdf',
    sizeBytes: resume.fileSize ?? 0,
    status,
    createdAt,
    confirmedAt: status === 'active' ? createdAt : undefined,
  };
}

export const resumeClient = {
  initUpload: async (fileName: string): Promise<ApiResumeUploadInitResponse> => {
    const response = await resumesApi.apiResumesUploadUrlPost({
      createResumeUploadUrlRequest: { fileName },
    });
    return {
      resumeId: response.resumeId ?? '',
      uploadUrl: response.uploadUrl ?? '',
      expiresAt: response.expiresAt?.toISOString() ?? '',
    };
  },

  // The backend presigns an S3 PUT url with a fixed "application/pdf" content
  // type. We must send the upload with that exact content-type; S3 will reject
  // the signature otherwise. No auth cookies / custom headers are needed — the
  // presigned url carries all auth.
  uploadToS3: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
  },

  confirm: async (resumeId: string): Promise<ApiResumeConfirmResponse> => {
    const response = await resumesApi.apiResumesIdConfirmPost({ id: resumeId });
    return toApiResume(response);
  },

  list: async (): Promise<ApiResumeListResponse> => {
    const response = await resumesApi.apiResumesGet();
    return { resumes: response.items?.map(toApiResume) ?? [] };
  },

  getDownloadUrl: async (
    resumeId: string,
    options?: { applicationId?: string },
  ): Promise<ApiResumeDownloadUrlResponse> => {
    const response = await resumesApi.apiResumesIdDownloadUrlGet({
      id: resumeId,
      applicationId: options?.applicationId,
    });
    return {
      downloadUrl: response.downloadUrl ?? '',
      expiresAt: response.expiresAt?.toISOString() ?? '',
    };
  },

  delete: async (resumeId: string): Promise<void> => {
    await resumesApi.apiResumesIdDelete({ id: resumeId });
  },
};

export default resumeClient;
