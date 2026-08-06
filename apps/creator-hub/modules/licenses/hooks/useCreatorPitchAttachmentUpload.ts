import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import useAssetsUploadOperationStatusPolling from '@modules/react-query/assetsUpload/useAssetsUploadOperationStatusPolling';
import useUploadCreatorPitchImageMutation from '../hooks/useUploadCreatorPitchImageMutation';
import {
  CreatorPitchAttachmentErrorType,
  CreatorPitchAttachmentStatus,
  MAX_CREATOR_PITCH_ATTACHMENT_COUNT,
} from '../utils/constants';
import type {
  CreatorPitchAttachment,
  CreatorPitchAttachmentsOnChange,
} from '../utils/creatorPitchAttachmentTypes';
import { getAttachmentPatchFromUploadStatus } from '../utils/creatorPitchAttachmentUploadStatus';
import { isAcceptedPitchAttachment } from '../utils/creatorPitchAttachmentValidation';
import { createCreatorPitchAttachmentFromFile } from '../utils/prepareCreatorPitchAttachmentsFromFiles';

interface UseCreatorPitchAttachmentUploadParams {
  attachments: CreatorPitchAttachment[];
  onChange: CreatorPitchAttachmentsOnChange;
  userId: number | undefined;
}

const isResumablePitchAttachmentUpload = (
  attachment: CreatorPitchAttachment,
): attachment is CreatorPitchAttachment & { operationId: string } =>
  attachment.operationId != null && attachment.status === CreatorPitchAttachmentStatus.Uploading;

const useCreatorPitchAttachmentUpload = ({
  attachments,
  onChange,
  userId,
}: UseCreatorPitchAttachmentUploadParams) => {
  const { mutateAsync: createUploadOperation } = useUploadCreatorPitchImageMutation();
  const { addOperationId, getUploadStatus, uploadingOperationIds, moderatingOperationIds } =
    useAssetsUploadOperationStatusPolling();

  const operationIdsToResume = useMemo(
    () =>
      attachments.flatMap((attachment) =>
        isResumablePitchAttachmentUpload(attachment) ? [attachment.operationId] : [],
      ),
    [attachments],
  );

  // Re-register persisted operation IDs after remount (e.g. navigating Back then returning).
  // Polling state is local to this hook; attachment rows with operationId live in the container.
  useEffect(() => {
    operationIdsToResume.forEach((operationId) => {
      addOperationId(operationId);
    });
  }, [addOperationId, operationIdsToResume]);

  useEffect(() => {
    onChange((previousAttachments) => {
      let hasChanges = false;

      const nextAttachments = previousAttachments.map((attachment) => {
        if (attachment.operationId == null) {
          return attachment;
        }

        const patch = getAttachmentPatchFromUploadStatus(
          attachment,
          getUploadStatus(attachment.operationId),
        );

        if (patch == null) {
          return attachment;
        }

        hasChanges = true;
        return { ...attachment, ...patch };
      });

      return hasChanges ? nextAttachments : previousAttachments;
    });
  }, [getUploadStatus, moderatingOperationIds, onChange, uploadingOperationIds]);

  const uploadAttachmentFile = useCallback(
    async (attachmentId: string, file: File, authenticatedUserId: number) => {
      try {
        const operationId = await createUploadOperation({
          file,
          userId: authenticatedUserId,
        });

        let attachmentStillExists = false;

        onChange((previousAttachments) => {
          attachmentStillExists = previousAttachments.some((item) => item.id === attachmentId);
          if (!attachmentStillExists) {
            return previousAttachments;
          }

          return previousAttachments.map((item) =>
            item.id === attachmentId ? { ...item, operationId } : item,
          );
        });

        if (attachmentStillExists) {
          addOperationId(operationId);
        }
      } catch {
        onChange((previousAttachments) => {
          if (!previousAttachments.some((item) => item.id === attachmentId)) {
            return previousAttachments;
          }

          return previousAttachments.map((item) =>
            item.id === attachmentId
              ? {
                  ...item,
                  status: CreatorPitchAttachmentStatus.Error,
                  errorType: CreatorPitchAttachmentErrorType.UploadFailed,
                  operationId: undefined,
                }
              : item,
          );
        });
      }
    },
    [addOperationId, createUploadOperation, onChange],
  );

  const handleFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0 || userId == null) {
        event.target.value = '';
        return;
      }

      const acceptedFiles = Array.from(selectedFiles).filter((file) =>
        isAcceptedPitchAttachment(file),
      );

      if (acceptedFiles.length === 0) {
        event.target.value = '';
        return;
      }

      const remainingSlots = MAX_CREATOR_PITCH_ATTACHMENT_COUNT - attachments.length;
      const filesToAdd = acceptedFiles.slice(0, Math.max(0, remainingSlots));

      filesToAdd.forEach((file) => {
        const attachment = createCreatorPitchAttachmentFromFile(file);

        onChange((previousAttachments) => [...previousAttachments, attachment]);

        if (attachment.status === CreatorPitchAttachmentStatus.Uploading) {
          void uploadAttachmentFile(attachment.id, file, userId);
        }
      });

      event.target.value = '';
    },
    [attachments.length, onChange, uploadAttachmentFile, userId],
  );

  const handleRemove = useCallback(
    (attachmentId: string) => {
      onChange((previousAttachments) =>
        previousAttachments.filter((item) => item.id !== attachmentId),
      );
    },
    [onChange],
  );

  const isAtMax = attachments.length >= MAX_CREATOR_PITCH_ATTACHMENT_COUNT;
  const canUpload = userId != null && !isAtMax;

  return {
    canUpload,
    handleFilesSelected,
    handleRemove,
  };
};

export default useCreatorPitchAttachmentUpload;
