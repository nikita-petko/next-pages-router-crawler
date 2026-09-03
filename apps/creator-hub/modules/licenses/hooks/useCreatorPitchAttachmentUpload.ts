import type { ChangeEvent } from 'react';
import { createElement, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslationWithNamespace } from '@rbx/intl';
import { Alert } from '@rbx/ui';
import useIpSnackbar from '@modules/ip/hooks/useIpSnackbar';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { AssetsUploadOperationStatus } from '@modules/react-query/assetsUpload/assetsUploadOperationStatusTypes';
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
import {
  getPitchAttachmentImageDimensions,
  isAcceptedPitchAttachment,
  isPitchAttachmentWithinResolutionLimit,
} from '../utils/creatorPitchAttachmentValidation';
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
  const { translate } = useTranslationWithNamespace(TranslationNamespace.Licenses);
  const { enqueueWithDefaults } = useIpSnackbar();
  const { addOperationId, getUploadStatus, uploadingOperationIds, moderatingOperationIds } =
    useAssetsUploadOperationStatusPolling();
  const pendingUploadAttachmentIds = useRef(new Set<string>());
  const reportedFailedAttachmentIds = useRef(new Set<string>());
  const uploadFailedText = translate('Error.PitchAttachmentUploadFailed');

  const reportUploadFailure = useCallback(
    (attachmentId: string) => {
      if (reportedFailedAttachmentIds.current.has(attachmentId)) {
        return;
      }

      reportedFailedAttachmentIds.current.add(attachmentId);
      enqueueWithDefaults({
        children: createElement(Alert, { severity: 'error' }, uploadFailedText),
      });
    },
    [enqueueWithDefaults, uploadFailedText],
  );

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
    const failedAttachmentIds = new Set(
      attachments.flatMap((attachment) => {
        if (attachment.operationId == null) {
          return [];
        }

        const { status } = getUploadStatus(attachment.operationId);
        return status === AssetsUploadOperationStatus.UploadFailed ||
          status === AssetsUploadOperationStatus.UploadTimedOut
          ? [attachment.id]
          : [];
      }),
    );

    failedAttachmentIds.forEach((attachmentId) => {
      reportUploadFailure(attachmentId);
      pendingUploadAttachmentIds.current.delete(attachmentId);
    });

    onChange((previousAttachments) => {
      let hasChanges = false;
      const nextAttachments = previousAttachments.flatMap((attachment) => {
        if (failedAttachmentIds.has(attachment.id)) {
          hasChanges = true;
          return [];
        }

        if (attachment.operationId == null) {
          return [attachment];
        }

        const patch = getAttachmentPatchFromUploadStatus(
          attachment,
          getUploadStatus(attachment.operationId),
        );

        if (patch == null) {
          return [attachment];
        }

        hasChanges = true;
        return [{ ...attachment, ...patch }];
      });

      return hasChanges ? nextAttachments : previousAttachments;
    });
  }, [
    attachments,
    getUploadStatus,
    moderatingOperationIds,
    onChange,
    reportUploadFailure,
    uploadingOperationIds,
  ]);

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
        if (pendingUploadAttachmentIds.current.has(attachmentId)) {
          pendingUploadAttachmentIds.current.delete(attachmentId);
          reportUploadFailure(attachmentId);
        }

        onChange((previousAttachments) => {
          if (!previousAttachments.some((item) => item.id === attachmentId)) {
            return previousAttachments;
          }

          return previousAttachments.filter((item) => item.id !== attachmentId);
        });
      }
    },
    [addOperationId, createUploadOperation, onChange, reportUploadFailure],
  );

  const addAndUploadAttachment = useCallback(
    async (file: File, authenticatedUserId: number) => {
      const attachment = createCreatorPitchAttachmentFromFile(file);
      pendingUploadAttachmentIds.current.add(attachment.id);
      onChange((previousAttachments) => [...previousAttachments, attachment]);

      if (attachment.status === CreatorPitchAttachmentStatus.Error) {
        return;
      }

      const dimensions = await getPitchAttachmentImageDimensions(file);
      if (
        dimensions != null &&
        !isPitchAttachmentWithinResolutionLimit(dimensions.width, dimensions.height)
      ) {
        onChange((previousAttachments) =>
          previousAttachments.map((item) =>
            item.id === attachment.id
              ? {
                  ...item,
                  status: CreatorPitchAttachmentStatus.Error,
                  errorType: CreatorPitchAttachmentErrorType.ResolutionTooLarge,
                }
              : item,
          ),
        );
        return;
      }

      void uploadAttachmentFile(attachment.id, file, authenticatedUserId);
    },
    [onChange, uploadAttachmentFile],
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
        void addAndUploadAttachment(file, userId);
      });

      event.target.value = '';
    },
    [addAndUploadAttachment, attachments.length, userId],
  );

  const handleRemove = useCallback(
    (attachmentId: string) => {
      pendingUploadAttachmentIds.current.delete(attachmentId);
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
