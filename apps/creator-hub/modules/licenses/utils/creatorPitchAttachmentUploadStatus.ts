import {
  AssetsUploadOperationStatus,
  type AssetsUploadOperationStatusDetails,
} from '@modules/react-query/assetsUpload/assetsUploadOperationStatusTypes';
import { CreatorPitchAttachmentErrorType, CreatorPitchAttachmentStatus } from './constants';
import type { CreatorPitchAttachment } from './creatorPitchAttachmentTypes';

const TERMINAL_UPLOAD_STATUSES = new Set<AssetsUploadOperationStatus>([
  AssetsUploadOperationStatus.Approved,
  AssetsUploadOperationStatus.ModerationPending,
  AssetsUploadOperationStatus.Rejected,
  AssetsUploadOperationStatus.UploadFailed,
  AssetsUploadOperationStatus.UploadTimedOut,
]);

const attachmentPatchChangesAttachment = (
  attachment: CreatorPitchAttachment,
  patch: Partial<CreatorPitchAttachment>,
): boolean =>
  (patch.status != null && patch.status !== attachment.status) ||
  (patch.assetId !== undefined && patch.assetId !== attachment.assetId) ||
  (patch.errorType !== undefined && patch.errorType !== attachment.errorType) ||
  (patch.operationId !== undefined && patch.operationId !== attachment.operationId);

export const mapUploadStatusToAttachmentFields = (
  details: AssetsUploadOperationStatusDetails,
): Pick<CreatorPitchAttachment, 'status' | 'assetId' | 'errorType'> | null => {
  switch (details.status) {
    case AssetsUploadOperationStatus.Unknown:
      return null;
    case AssetsUploadOperationStatus.Uploading:
      return {
        status: CreatorPitchAttachmentStatus.Uploading,
        ...(details.assetId != null ? { assetId: details.assetId } : {}),
      };
    case AssetsUploadOperationStatus.Moderating:
      return {
        status: CreatorPitchAttachmentStatus.PendingModeration,
        ...(details.assetId != null ? { assetId: details.assetId } : {}),
      };
    case AssetsUploadOperationStatus.Approved:
      return {
        status: CreatorPitchAttachmentStatus.Ready,
        assetId: details.assetId,
        errorType: undefined,
      };
    case AssetsUploadOperationStatus.ModerationPending:
      return {
        status: CreatorPitchAttachmentStatus.PendingModeration,
        assetId: details.assetId,
        errorType: undefined,
      };
    case AssetsUploadOperationStatus.Rejected:
      return {
        status: CreatorPitchAttachmentStatus.Error,
        assetId: details.assetId,
        errorType: CreatorPitchAttachmentErrorType.Moderated,
      };
    case AssetsUploadOperationStatus.UploadFailed:
    case AssetsUploadOperationStatus.UploadTimedOut:
      return {
        status: CreatorPitchAttachmentStatus.Error,
        errorType: CreatorPitchAttachmentErrorType.UploadFailed,
      };
    default:
      return null;
  }
};

export const getAttachmentPatchFromUploadStatus = (
  attachment: CreatorPitchAttachment,
  details: AssetsUploadOperationStatusDetails,
): Partial<CreatorPitchAttachment> | null => {
  const fields = mapUploadStatusToAttachmentFields(details);
  if (fields == null) {
    return null;
  }

  const patch: Partial<CreatorPitchAttachment> = {
    ...fields,
    ...(TERMINAL_UPLOAD_STATUSES.has(details.status) ? { operationId: undefined } : {}),
  };

  return attachmentPatchChangesAttachment(attachment, patch) ? patch : null;
};
