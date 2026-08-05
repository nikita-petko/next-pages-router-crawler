import { useMutation } from '@tanstack/react-query';
import { assetCreationFailureEventModel } from '@modules/asset-creation/constants/eventConstants';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import type { AssetType } from '@modules/clients/assetsupload';
import type { CreationContext, Creator } from '@modules/clients/assetsupload';
import { MultipartUploadError } from '@modules/clients/multipartUploadError';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import usePollOperationForAssetUploadMutation from '../../../placeThumbnails/hooks/usePollOperationForAssetUploadMutation';

const PREVIEWS_FIELD_MASK_ARRAY = [FieldMask.PREVIEWS];

/** Maximum polls for video upload operations (15 minutes at 2 s interval). */
const VIDEO_UPLOAD_MAX_POLLS = 450;
const VIDEO_UPLOAD_POLL_INTERVAL = 2000;

export enum UploadPreviewOperationStage {
  UPLOAD_INITIATION = 'UPLOAD_INITIATION',
  UPLOAD_POLLING = 'UPLOAD_POLLING',
  UPLOAD_TRANSCODE = 'UPLOAD_TRANSCODE',
  ASSOCIATION_INITIATION = 'ASSOCIATION_INITIATION',
  ASSOCIATION_POLLING = 'ASSOCIATION_POLLING',
  ASSOCIATION_COMPLETION = 'ASSOCIATION_COMPLETION',
}

export class UploadPreviewOperationError extends Error {
  public stage: UploadPreviewOperationStage;

  public httpStatus?: number;

  public errorCode?: string;

  public previewAssetId?: number;

  public operationId?: string;

  public chunkIndex?: number;

  public retryAttempt?: number;

  /** Full backend Status from a completed-but-failed operation (mirrors UploadOperationError.status). */
  public operationStatus?: { code?: number | string; details?: Array<{ reason?: string }> };

  constructor(
    message: string,
    stage: UploadPreviewOperationStage,
    httpStatus?: number,
    errorCode?: string,
    previewAssetId?: number,
    operationId?: string,
    chunkIndex?: number,
    retryAttempt?: number,
    operationStatus?: { code?: number | string; details?: Array<{ reason?: string }> },
  ) {
    super(message);
    this.stage = stage;
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
    this.previewAssetId = previewAssetId;
    this.operationId = operationId;
    this.chunkIndex = chunkIndex;
    this.retryAttempt = retryAttempt;
    this.operationStatus = operationStatus;
  }
}

export interface VideoUploadProgressCallbacks {
  /** Phase 1: multipart file upload (0–35%). Progress is 0–100. */
  onMultipartUploadProgress?: (progress: number) => void;
  /** Phase 2: create operation polling (35–90%). Progress is 0–100. */
  onUploadOperationPollProgress?: (progress: number) => void;
  /** Phase 3: association operation polling (90–100%). Progress is 0–100. */
  onAssociateOperationPollProgress?: (progress: number) => void;
}

const hasStatus = (error: unknown): error is Error & { status: unknown } =>
  error instanceof Error && 'status' in error;

const getHttpStatus = (error: unknown): number | undefined => {
  if (hasStatus(error)) {
    return typeof error.status === 'number' ? error.status : undefined;
  }
  return undefined;
};

const normalizeOperationStatus = (
  status:
    | { code?: string | number | null; details?: Array<{ reason?: string | null }> }
    | null
    | undefined,
): { code?: number | string; details?: Array<{ reason?: string }> } | undefined => {
  if (!status) {
    return undefined;
  }
  return {
    code: status.code ?? undefined,
    details: status.details?.map((d) => ({ reason: d.reason ?? undefined })),
  };
};

/**
 * Handles the full video preview upload pipeline for a Creator Store asset:
 *   1. Upload to Assets API — multipart when isMultipartUpload is true, standard otherwise
 *   2. Poll create operation until transcoding completes
 *   3. Associate the new preview with the parent asset and poll until done
 *
 * Mirrors the structure of useUploadAssetForPlaceMutation (Game Preview).
 */
const useUploadPreviewVideoMutation = (
  assetId: number,
  creatorId: number,
  creatorType: CreatorType,
  videoPreviewType: AssetType,
  onSuccess?: () => void,
  onError?: (message: string) => void,
  progressCallbacks?: VideoUploadProgressCallbacks,
  isMultipartUpload?: boolean,
) => {
  const { trackerClient } = useEventTrackerProvider();

  const { pollForCompletedOperationAsync: pollForCreateOperationAsync } =
    usePollOperationForAssetUploadMutation(
      undefined,
      undefined,
      progressCallbacks?.onUploadOperationPollProgress,
      VIDEO_UPLOAD_MAX_POLLS,
      VIDEO_UPLOAD_POLL_INTERVAL,
    );

  const { pollForCompletedOperationAsync: pollForAssociateOperationAsync } =
    usePollOperationForAssetUploadMutation(
      undefined,
      undefined,
      progressCallbacks?.onAssociateOperationPollProgress,
      VIDEO_UPLOAD_MAX_POLLS,
      VIDEO_UPLOAD_POLL_INTERVAL,
    );

  const {
    mutateAsync: uploadPreviewVideoAsync,
    isPending: isUploadingVideo,
    isError: isUploadVideoError,
  } = useMutation({
    mutationFn: async ({
      file,
      existingImagePreviewIds,
    }: {
      file: File;
      existingImagePreviewIds: number[];
      existingVideoPreviewId: number | null;
    }) => {
      let creator: Creator;
      switch (creatorType) {
        case CreatorType.Group:
          creator = { groupId: creatorId };
          break;
        case CreatorType.User:
          creator = { userId: creatorId };
          break;
        default:
          throw new UploadPreviewOperationError(
            `Unsupported creator type: ${String(creatorType)}`,
            UploadPreviewOperationStage.UPLOAD_INITIATION,
          );
      }
      const creationContext: CreationContext = { creator };

      // Phase 1: upload (multipart when flag is on, standard single-request otherwise)
      const uploadRequestInfo = {
        assetType: videoPreviewType,
        displayName: `Preview for Asset: ${assetId}`,
        creationContext,
      };
      let createOperationId: string;
      try {
        if (isMultipartUpload) {
          createOperationId = await assetsUploadApiClient.createAssetAndGetOperationIdWithMultipart(
            uploadRequestInfo,
            file,
            false, // videos do not require open-use label
            progressCallbacks?.onMultipartUploadProgress,
          );
        } else {
          createOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
            uploadRequestInfo,
            file,
            false,
          );
        }
      } catch (error) {
        if (error instanceof MultipartUploadError) {
          throw new UploadPreviewOperationError(
            `Failed to initiate multipart upload: ${error.message}`,
            UploadPreviewOperationStage.UPLOAD_INITIATION,
            error.httpStatus,
            error.errorCode,
            undefined,
            error.operationId,
            error.chunkIndex,
            error.retryAttempt,
          );
        }
        const httpStatus = getHttpStatus(error);
        throw new UploadPreviewOperationError(
          `Failed to initiate ${isMultipartUpload ? 'multipart' : 'standard'} upload`,
          UploadPreviewOperationStage.UPLOAD_INITIATION,
          httpStatus,
        );
      }

      // Phase 2: poll create operation (transcoding)
      let createOperation;
      try {
        createOperation = await pollForCreateOperationAsync(createOperationId);
      } catch (error) {
        const httpStatus = getHttpStatus(error);
        throw new UploadPreviewOperationError(
          `Failed to poll create operation ${createOperationId}`,
          UploadPreviewOperationStage.UPLOAD_POLLING,
          httpStatus,
          undefined,
          undefined,
          createOperationId,
        );
      }
      if (!createOperation?.response) {
        throw new UploadPreviewOperationError(
          'Create operation completed without a response (transcode failure)',
          UploadPreviewOperationStage.UPLOAD_TRANSCODE,
          getHttpStatus(createOperation?.error),
          undefined,
          undefined,
          createOperationId,
          undefined,
          undefined,
          normalizeOperationStatus(createOperation?.error),
        );
      }

      // New video always goes first; existing image previews are preserved as-is
      const newAssetPath = createOperation.response.path;
      const newAssetId = Number(newAssetPath?.split('/')[1] ?? 0);
      const combinedPreviews = [newAssetId, ...existingImagePreviewIds].map((id) => ({
        asset: `assets/${id}`,
      }));

      // Phase 3: associate preview to parent asset
      let updateOperationId: string;
      try {
        updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
          assetId,
          PREVIEWS_FIELD_MASK_ARRAY,
          { assetId, previews: combinedPreviews },
        );
      } catch (error) {
        const httpStatus = getHttpStatus(error);
        throw new UploadPreviewOperationError(
          `Failed to initiate association of preview asset ${newAssetId} to asset ${assetId}`,
          UploadPreviewOperationStage.ASSOCIATION_INITIATION,
          httpStatus,
          undefined,
          newAssetId,
        );
      }

      let updateOperation;
      try {
        updateOperation = await pollForAssociateOperationAsync(updateOperationId);
      } catch (error) {
        const httpStatus = getHttpStatus(error);
        throw new UploadPreviewOperationError(
          `Failed to poll association operation ${updateOperationId}`,
          UploadPreviewOperationStage.ASSOCIATION_POLLING,
          httpStatus,
          undefined,
          newAssetId,
          updateOperationId,
        );
      }
      if (!updateOperation?.response) {
        throw new UploadPreviewOperationError(
          'Associate operation completed without a response',
          UploadPreviewOperationStage.ASSOCIATION_COMPLETION,
          getHttpStatus(updateOperation?.error),
          undefined,
          newAssetId,
          updateOperationId,
          undefined,
          undefined,
          normalizeOperationStatus(updateOperation?.error),
        );
      }

      return { newAssetId };
    },
    retry: false,
    onSuccess: () => onSuccess?.(),
    onError: async (
      error,
      variables: {
        file: File;
        existingImagePreviewIds: number[];
        existingVideoPreviewId: number | null;
      },
    ) => {
      let httpErrorCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
      let message = 'AssetCreationFailed';
      let stage = 'UNKNOWN_STAGE';
      let errorCode = '';
      let operationId = '';
      let errorReasons = '';

      if (error instanceof Error) {
        message = error.message;
      } else {
        const parsed = await tryParseResponseError(error);
        if (parsed) {
          httpErrorCode = parsed.status;
          message = parsed.message;
        }
      }

      if (error instanceof UploadPreviewOperationError) {
        stage = error.stage;
        httpErrorCode = error.httpStatus ?? httpErrorCode;
        errorCode = error.errorCode ?? '';
        operationId = error.operationId ?? '';
        if (error.chunkIndex) {
          message = `${message} (chunk ${error.chunkIndex})`;
        }
        if (error.retryAttempt) {
          message = `${message} (attempt ${error.retryAttempt})`;
        }
        if (error.operationStatus) {
          const statusCode = error.operationStatus.code;
          if (statusCode !== undefined && !errorCode) {
            errorCode = statusCode.toString();
          }
          errorReasons =
            error.operationStatus.details
              ?.map((d) => d.reason)
              .filter(Boolean)
              .join(',') ?? '';
        }
      }

      const previewAssetId =
        error instanceof UploadPreviewOperationError ? error.previewAssetId : undefined;

      const detailedMessage = [
        `parentAssetId:${assetId}`,
        `stage:${stage}`,
        `code:${httpErrorCode}`,
        `message:${message}`,
        errorCode ? `errorCode:${errorCode}` : '',
        errorReasons ? `errorReasons:${errorReasons}` : '',
        operationId ? `operationId:${operationId}` : '',
        previewAssetId !== undefined ? `previewAssetId:${previewAssetId}` : '',
        variables?.file?.size ? `fileSize:${variables.file.size}` : '',
      ]
        .filter(Boolean)
        .join(',');

      trackerClient.sendEvent(
        assetCreationFailureEventModel(videoPreviewType, creatorId, detailedMessage),
      );

      onError?.(message);
    },
  });

  return { uploadPreviewVideoAsync, isUploadingVideo, isUploadVideoError };
};

export default useUploadPreviewVideoMutation;
