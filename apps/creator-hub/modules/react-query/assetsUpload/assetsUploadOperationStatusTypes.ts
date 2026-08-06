import type { ModerationState } from '@rbx/client-assets-upload-api/v1';

export const ASSETS_UPLOAD_OPERATION_STATUS_QUERY_KEY_PREFIX =
  'assetsUploadOperationStatus' as const;

export const ASSETS_UPLOAD_MODERATION_STATUS_QUERY_KEY_PREFIX =
  'assetsUploadModerationStatus' as const;

export const ASSETS_UPLOAD_POLLING_INTERVAL_MS = 1000;
export const ASSETS_UPLOAD_POLLING_MAX_RETRIES = 25;

export enum AssetsUploadOperationStatus {
  Unknown = 'unknown',
  Uploading = 'uploading',
  UploadFailed = 'upload_failed',
  UploadTimedOut = 'upload_timed_out',
  Moderating = 'moderating',
  Approved = 'approved',
  Rejected = 'rejected',
  ModerationPending = 'moderation_pending',
}

export interface AssetsUploadOperationStatusDetails {
  status: AssetsUploadOperationStatus;
  assetId?: number;
  errorMessage?: string;
  moderationState?: ModerationState;
}

export type AssetsUploadOperationPhase = 'upload' | 'moderation' | 'terminal';

export interface AssetsUploadOperationRecord {
  operationId: string;
  phase: AssetsUploadOperationPhase;
  assetId?: number;
  uploadStatus?: 'pending' | 'failed' | 'timed_out' | 'complete';
  uploadPollAttempts?: number;
  initialModerationState?: ModerationState;
  moderationState?: ModerationState;
  moderationPollAttempts?: number;
  moderationTimedOut?: boolean;
  errorMessage?: string;
}

export const getAssetsUploadOperationStatusQueryKey = (operationId: string) =>
  [ASSETS_UPLOAD_OPERATION_STATUS_QUERY_KEY_PREFIX, operationId] as const;

export const getAssetsUploadModerationStatusQueryKey = (operationId: string, assetId: number) =>
  [ASSETS_UPLOAD_MODERATION_STATUS_QUERY_KEY_PREFIX, operationId, assetId] as const;
