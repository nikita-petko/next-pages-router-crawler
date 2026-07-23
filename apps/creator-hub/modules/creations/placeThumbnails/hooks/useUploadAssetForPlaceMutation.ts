import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Status } from '@rbx/client-assets-upload-api/v1';
import { PreviewFromJSON } from '@rbx/client-assets-upload-api/v1';
import { useTranslation } from '@rbx/intl';
import { assetCreationFailureEventModel } from '@modules/asset-creation/constants/eventConstants';
import type { AssetType } from '@modules/clients/assetsupload';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import { MultipartUploadError } from '@modules/clients/multipartUploadError';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { HttpStatusCodes } from '@modules/miscellaneous/common';
import usePollOperationForAssetUploadMutation from './usePollOperationForAssetUploadMutation';

export enum UploadOperationStage {
  UPLOAD_INITIATION = 'UPLOAD_INITIATION',
  UPLOAD_POLLING = 'UPLOAD_POLLING',
  UPLOAD_TRANSCODE = 'UPLOAD_TRANSCODE',
  ASSOCIATION_FETCH_PREVIEWS = 'ASSOCIATION_FETCH_PREVIEWS',
  ASSOCIATION_INITIATION = 'ASSOCIATION_INITIATION',
  ASSOCIATION_POLLING = 'ASSOCIATION_POLLING',
  ASSOCIATION_COMPLETION = 'ASSOCIATION_COMPLETION',
}

class UploadOperationError extends Error {
  public status?: Status = undefined;

  public assetId?: number = undefined;

  public stage?: UploadOperationStage = undefined;

  public operationId?: string = undefined;

  public httpStatus?: number = undefined;

  public errorCode?: string = undefined;

  public chunkIndex?: number = undefined;

  public retryAttempt?: number = undefined;

  constructor(
    message: string,
    status?: Status,
    assetId?: number,
    stage?: UploadOperationStage,
    operationId?: string,
    httpStatus?: number,
    errorCode?: string,
    chunkIndex?: number,
    retryAttempt?: number,
  ) {
    super(message);
    this.status = status;
    this.assetId = assetId;
    this.stage = stage;
    this.operationId = operationId;
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
    this.chunkIndex = chunkIndex;
    this.retryAttempt = retryAttempt;
  }
}

export interface PollingConfig {
  maxPolls?: number;
  pollInterval?: number;
}

export interface ProgressCallbacks {
  onMultipartUploadProgress?: (progress: number) => void;
  onUploadOperationPollProgress?: (progress: number) => void;
  onAssociateOperationPollProgress?: (progress: number) => void;
}

/**
 * Two steps to upload a asset (thumbnail, preview video, icon) to a place:
 * 1. upload a thumbnail to the assets system,
 * 2. "associate" the newly uploaded asset (thumbnail, preview video, icon) to the place along with the other assets (thumbnails, preview videos, icons) that the place already has
 */
const useUploadAssetForPlaceMutation = (
  placeId: number,
  userId: number,
  groupId?: number,
  isGroupUpload?: boolean,
  onSuccess?: () => void,
  onError?: (reason: string) => void,
  isMultipartUpload?: boolean,
  pollingConfig?: PollingConfig,
  progressCallbacks?: ProgressCallbacks,
) => {
  const { translate } = useTranslation();

  const { pollForCompletedOperationAsync: pollForUploadOperationAsync } =
    usePollOperationForAssetUploadMutation(
      undefined,
      undefined,
      progressCallbacks?.onUploadOperationPollProgress,
      pollingConfig?.maxPolls,
      pollingConfig?.pollInterval,
    );
  const { pollForCompletedOperationAsync: pollForUpdateOperationAync } =
    usePollOperationForAssetUploadMutation(
      undefined,
      undefined,
      progressCallbacks?.onAssociateOperationPollProgress,
      pollingConfig?.maxPolls,
      pollingConfig?.pollInterval,
    );
  const { trackerClient } = useEventTrackerProvider();

  const {
    mutate: uploadAssetForPlace,
    mutateAsync: uploadAssetForPlaceAsync,
    isPending: isUploading,
    isError: isUploadingError,
  } = useMutation({
    mutationFn: async ({
      file,
      assetType,
      price,
      setAssetPrivacyToOpenUse = true, // setAssetPrivacyToOpenUse, required for newly uploaded Previews and Icons
      displayName = `Asset Thumbnail`,
    }: {
      file: File;
      assetType: AssetType;
      price: number;
      setAssetPrivacyToOpenUse?: boolean;
      displayName?: string;
    }) => {
      /** beginning of step 1. upload a asset to the assets system, */
      const uploadRequestInfo = {
        assetType,
        displayName,
        creationContext: {
          creator: isGroupUpload ? { groupId } : { userId },
          expectedPrice: price,
        },
      };
      let uploadOperationId: string;
      try {
        if (isMultipartUpload) {
          uploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationIdWithMultipart(
            uploadRequestInfo,
            file,
            setAssetPrivacyToOpenUse,
            progressCallbacks?.onMultipartUploadProgress,
          );
        } else {
          uploadOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
            uploadRequestInfo,
            file,
            setAssetPrivacyToOpenUse,
          );
        }
      } catch (error) {
        if (error instanceof MultipartUploadError) {
          throw new UploadOperationError(
            `Failed to initiate multipart upload for asset type ${assetType}: ${error.message}`,
            undefined,
            undefined,
            UploadOperationStage.UPLOAD_INITIATION,
            error.operationId,
            error.httpStatus,
            error.errorCode,
            error.chunkIndex,
            error.retryAttempt,
          );
        }
        const httpStatus =
          error instanceof Error && 'status' in error
            ? (error as { status: number }).status
            : undefined;
        throw new UploadOperationError(
          `Failed to initiate ${isMultipartUpload ? 'multipart' : 'standard'} upload for asset type ${assetType}`,
          undefined,
          undefined,
          UploadOperationStage.UPLOAD_INITIATION,
          undefined,
          httpStatus,
        );
      }

      let uploadOperation;
      try {
        uploadOperation = await pollForUploadOperationAsync(uploadOperationId);
      } catch (error) {
        const httpStatus =
          error instanceof Error && 'status' in error
            ? (error as { status: number }).status
            : undefined;
        throw new UploadOperationError(
          `Failed to poll upload operation ${uploadOperationId}`,
          undefined,
          undefined,
          UploadOperationStage.UPLOAD_POLLING,
          uploadOperationId,
          httpStatus,
        );
      }
      if (!uploadOperation.response) {
        const httpStatus =
          uploadOperation.error && 'status' in uploadOperation.error
            ? (uploadOperation.error as { status: number }).status
            : undefined;
        throw new UploadOperationError(
          'Upload operation failed',
          uploadOperation.error,
          undefined,
          UploadOperationStage.UPLOAD_TRANSCODE,
          uploadOperationId,
          httpStatus,
        );
      }
      const asset = uploadOperation.response;
      /** end of step 1 */

      /** beginning of step 2. "associate" the newly uploaded asset to the place */
      const newPreviewItem = PreviewFromJSON({
        asset: `assets/${asset.assetId}`,
        altText: '',
      });
      let currentPreviewListResponse;
      try {
        currentPreviewListResponse = await assetsUploadApiClient.getAsset(placeId, [
          FieldMask.PREVIEWS,
        ]);
      } catch (error) {
        const httpStatus =
          error instanceof Error && 'status' in error
            ? (error as { status: number }).status
            : undefined;
        throw new UploadOperationError(
          `Failed to fetch current previews for place ${placeId}`,
          undefined,
          asset?.assetId,
          UploadOperationStage.ASSOCIATION_FETCH_PREVIEWS,
          undefined,
          httpStatus,
        );
      }

      const currentPreviewList = currentPreviewListResponse.previews ?? [];
      const newPreviewList = [newPreviewItem, ...currentPreviewList];

      let updateOperationId: string;
      try {
        updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
          placeId,
          [FieldMask.PREVIEWS],
          {
            assetId: placeId,
            previews: newPreviewList,
          },
        );
      } catch (error) {
        const httpStatus =
          error instanceof Error && 'status' in error
            ? (error as { status: number }).status
            : undefined;
        throw new UploadOperationError(
          `Failed to initiate association of asset ${asset?.assetId} to place ${placeId}`,
          undefined,
          asset?.assetId,
          UploadOperationStage.ASSOCIATION_INITIATION,
          undefined,
          httpStatus,
        );
      }

      let updateOperation;
      try {
        updateOperation = await pollForUpdateOperationAync(updateOperationId);
      } catch (error) {
        const httpStatus =
          error instanceof Error && 'status' in error
            ? (error as { status: number }).status
            : undefined;
        throw new UploadOperationError(
          `Failed to poll association operation ${updateOperationId}`,
          undefined,
          asset?.assetId,
          UploadOperationStage.ASSOCIATION_POLLING,
          updateOperationId,
          httpStatus,
        );
      }
      if (!updateOperation.response) {
        const httpStatus =
          updateOperation.error && 'status' in updateOperation.error
            ? (updateOperation.error as { status: number }).status
            : undefined;
        throw new UploadOperationError(
          'Associate uploaded asset to place operation failed',
          updateOperation.error,
          asset?.assetId,
          UploadOperationStage.ASSOCIATION_COMPLETION,
          updateOperationId,
          httpStatus,
        );
      }
      /** end of step 2 */

      return updateOperation.response;
    },
    retry: false,
    onSuccess,
    onError: async (
      error,
      variables: {
        file: File;
        assetType: AssetType;
        price: number;
        setAssetPrivacyToOpenUse?: boolean;
        displayName?: string;
      },
    ) => {
      const unknownError = translate('Error.UnknownError' /* CreatorDashboard.Error namespace */);
      if (error instanceof UploadOperationError) {
        onError?.(error.status?.message ?? unknownError);
      } else {
        onError?.(unknownError);
      }

      let httpErrorCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR;
      let baseMessage = 'AssetCreationFailed';
      let errorCode = '';
      let errorReasons = '';
      let operationId = '';
      let stage = 'UNKNOWN_STAGE';

      if (error instanceof Error) {
        baseMessage = error.message;
      } else {
        const parsed = await tryParseResponseError(error);
        if (parsed) {
          httpErrorCode = parsed.status;
          baseMessage = parsed.message;
        }
      }

      if (error instanceof UploadOperationError) {
        stage = error.stage || 'UNKNOWN_STAGE';
        httpErrorCode = error.httpStatus || httpErrorCode;
        errorCode = error.errorCode || '';
        operationId = error.operationId || '';
        if (error.chunkIndex) {
          baseMessage = `${baseMessage} (chunk ${error.chunkIndex})`;
        }
        if (error.retryAttempt) {
          baseMessage = `${baseMessage} (attempt ${error.retryAttempt})`;
        }
        if (error.status) {
          httpErrorCode = typeof error.status.code === 'number' ? error.status.code : httpErrorCode;
          if (!errorCode) {
            errorCode = error.status.code?.toString() || '';
          }
          errorReasons =
            error.status.details
              ?.map((d) => d.reason)
              .filter(Boolean)
              .join(',') || errorReasons;
        }
      }

      const creatorId = isGroupUpload ? groupId : userId;

      const detailedMessage = [
        `placeId:${placeId}`,
        `stage:${stage}`,
        `code:${httpErrorCode}`,
        `message:${baseMessage}`,
        errorCode ? `errorCode:${errorCode}` : '',
        errorReasons ? `errorReasons:${errorReasons}` : '',
        operationId ? `operationId:${operationId}` : '',
        error instanceof UploadOperationError && error.assetId ? `assetId:${error.assetId}` : '',
        variables?.file?.size ? `fileSize:${variables.file.size}` : '',
      ]
        .filter(Boolean)
        .join(',');

      trackerClient.sendEvent(
        assetCreationFailureEventModel(variables?.assetType, creatorId, detailedMessage),
      );
    },
  });

  return useMemo(
    () => ({ uploadAssetForPlace, uploadAssetForPlaceAsync, isUploading, isUploadingError }),
    [isUploading, isUploadingError, uploadAssetForPlace, uploadAssetForPlaceAsync],
  );
};

export default useUploadAssetForPlaceMutation;
