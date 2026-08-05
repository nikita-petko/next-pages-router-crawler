import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CreationContext, Creator, Preview } from '@rbx/client-assets-upload-api/v1';
import { AssetType, ModerationState } from '@rbx/client-assets-upload-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import {
  isCreatorStoreVideoMultipartUploadEnabled,
  isModelCustomThumbnailUploadEnabled,
} from '@generated/flags/contentAccessAndInventory';
import { assetCreationFailureEventModel } from '@modules/asset-creation/constants/eventConstants';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import publishClient from '@modules/clients/publish';
import { getErrorCode } from '@modules/clients/utils/errorHelpers';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { Asset, PublishError, HttpStatusCodes } from '@modules/miscellaneous/common';
import publishErrorDescription from '@modules/miscellaneous/common/constants/publishErrorDescription';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import usePollOperationForAssetUploadMutation from '../../../placeThumbnails/hooks/usePollOperationForAssetUploadMutation';
import { logCreatorStoreCustomThumbnailUpload } from '../analytics';
import type { CreatorStoreConfigurationType } from '../components/CreatorStoreConfiguration/types';
import {
  createStorePreviewVideoUploadFailureEvent,
  createStorePreviewVideoUploadStartEvent,
  createStorePreviewVideoUploadSuccessEvent,
} from '../storePreviewVideoEventConstants';
import useAssetsUploadApiModerationPolling from './useAssetsUploadApiModerationPolling';
import useUploadPreviewVideoMutation from './useUploadPreviewVideoMutation';
import type { VideoUploadProgressCallbacks } from './useUploadPreviewVideoMutation';

const hasStatus = (error: unknown): error is Error & { status: unknown } =>
  error instanceof Error && 'status' in error;

/** Throws if a completed operation has no response (backend-reported failure). */
const assertOperationResponse = (operation: { response?: unknown } | null | undefined): void => {
  if (!operation?.response) {
    throw new Error('Operation completed without a successful response');
  }
};

const PREVIEW_DETAILS_FIELD_MASK_ARRAY = [FieldMask.ASSET_TYPE, FieldMask.MODERATION_RESULT];
const PREVIEWS_FIELD_MASK_ARRAY = [FieldMask.PREVIEWS];
const ICON_FIELD_MASK_ARRAY = [FieldMask.ICON];
const SUPPORTED_PREVIEW_ASSET_TYPES = [Asset.MeshPart, Asset.Model, Asset.Plugin];
const SUPPORTED_CUSTOM_THUMBNAIL_ASSET_TYPES = [Asset.Model, Asset.Plugin];
const SUPPORTED_CUSTOM_THUMBNAIL_REMOVAL_ASSET_TYPES = [Asset.Model];

export interface FetchPreviewIdsResponse {
  imagePreviewIds: number[];
  videoPreviewId: number | null;
  videoModerationState: ModerationState;
}

export interface PreviewsContext {
  arePreviewsEnabled: boolean;
  areVideoPreviewsEnabled: boolean;
  isConfiguringThumbnailEnabled: boolean;
  isRemovingThumbnailEnabled: boolean;
  hasRemovableThumbnail: boolean;
  fetchPreviewIds: () => Promise<FetchPreviewIdsResponse>;
  uploadPreview: (
    preview: File,
    previewAssetType: AssetType,
    existingImagePreviewIds: number[],
    existingVideoPreviewId: number | null,
  ) => Promise<void>;
  deletePreview: (
    previewId: number,
    existingImagePreviewIds: number[],
    existingVideoPreviewId: number | null,
  ) => Promise<void>;
  configurePreviews: (
    data: CreatorStoreConfigurationType,
    methods: UseFormReturn<CreatorStoreConfigurationType>,
  ) => Promise<void>;
  configureThumbnail: (
    data: CreatorStoreConfigurationType,
    methods: UseFormReturn<CreatorStoreConfigurationType>,
  ) => Promise<void>;
}

const getPreviewsArray = async (assetId: number): Promise<Preview[]> => {
  const data = await assetsUploadApiClient.getAsset(assetId, PREVIEWS_FIELD_MASK_ARRAY);
  return data.previews ?? [];
};

const parsePreviewIdFromPreview = (preview: Preview): number => {
  const assetNumber = preview.asset?.split('/')[1];
  return assetNumber ? Number(assetNumber) : 0;
};

const getPreviewsArrayFromPreviewIds = (previewIds: number[]): Preview[] => {
  return previewIds.map((id) => ({ asset: `assets/${id}` }));
};

const combinePreviewIds = (videoPreviewId: number | null, imagePreviewIds: number[]): number[] => {
  const combined: number[] = [];

  if (videoPreviewId !== null) {
    combined.push(videoPreviewId);
  }

  return combined.concat(imagePreviewIds);
};

const usePreviews = (
  assetId: number,
  assetType: Asset,
  creatorId: number,
  creatorType: CreatorType,
  refreshThumbnail: VoidFunction,
  videoPreviewType: AssetType,
  progressCallbacks?: VideoUploadProgressCallbacks,
  resetVideoUploadProgress?: () => void,
): PreviewsContext => {
  const { translate } = useTranslation();
  const { pollForAssetModerationApproval } = useAssetsUploadApiModerationPolling();
  const { trackerClient } = useEventTrackerProvider();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const { value: isMultipartUploadFlagValue } = useFlag(isCreatorStoreVideoMultipartUploadEnabled);
  const isMultipartUpload = isMultipartUploadFlagValue ?? false;

  const videoUploadStartTimeRef = useRef<number>(0);
  const videoUploadFileSizeRef = useRef<number>(0);

  // General non-video operations: delete, configure, thumbnail — no progress tracking
  const { pollForCompletedOperationAsync: pollForOperationAsync } =
    usePollOperationForAssetUploadMutation();

  const onVideoUploadSuccess = useCallback(() => {
    const duration = performance.now() - videoUploadStartTimeRef.current;
    unifiedLogger.logImpressionEvent(
      createStorePreviewVideoUploadSuccessEvent({
        assetId,
        fileSize: videoUploadFileSizeRef.current,
        creatorId,
        duration,
      }),
    );
  }, [assetId, creatorId, unifiedLogger]);

  const onVideoUploadError = useCallback(
    (message: string) => {
      resetVideoUploadProgress?.();
      const duration = performance.now() - videoUploadStartTimeRef.current;
      unifiedLogger.logImpressionEvent(
        createStorePreviewVideoUploadFailureEvent({
          assetId,
          fileSize: videoUploadFileSizeRef.current,
          creatorId,
          duration,
          error: message,
        }),
      );
    },
    [assetId, creatorId, resetVideoUploadProgress, unifiedLogger],
  );

  const { uploadPreviewVideoAsync } = useUploadPreviewVideoMutation(
    assetId,
    creatorId,
    creatorType,
    videoPreviewType,
    onVideoUploadSuccess,
    onVideoUploadError,
    progressCallbacks,
    isMultipartUpload,
  );

  const arePreviewsEnabled = useMemo(() => {
    return SUPPORTED_PREVIEW_ASSET_TYPES.includes(assetType);
  }, [assetType]);

  // Keep a dedicated video-enabled flag for:
  // 1) Backwards compatibility with existing consumers expecting a video-specific toggle
  // 2) Future flexibility to reintroduce separate gating for video previews without API changes
  const areVideoPreviewsEnabled = arePreviewsEnabled;

  const { value: isModelCustomThumbnailUploadFlagValue } = useFlag(
    isModelCustomThumbnailUploadEnabled,
  );
  const isModelCustomThumbnailUploadFlagEnabled = isModelCustomThumbnailUploadFlagValue ?? false;

  const isConfiguringThumbnailEnabled =
    SUPPORTED_CUSTOM_THUMBNAIL_ASSET_TYPES.includes(assetType) &&
    (assetType !== Asset.Model || isModelCustomThumbnailUploadFlagEnabled);

  const isRemovingThumbnailEnabled =
    isModelCustomThumbnailUploadFlagEnabled &&
    SUPPORTED_CUSTOM_THUMBNAIL_REMOVAL_ASSET_TYPES.includes(assetType);

  const [hasCustomThumbnail, setHasCustomThumbnail] = useState(false);

  useEffect(() => {
    if (!isRemovingThumbnailEnabled) {
      return;
    }

    void assetsUploadApiClient.getAsset(assetId, ICON_FIELD_MASK_ARRAY).then((asset) => {
      // If asset.icon exists, a custom thumbnail is present
      setHasCustomThumbnail(Boolean(asset.icon));
    });
  }, [assetId, isRemovingThumbnailEnabled]);

  const hasRemovableThumbnail = isRemovingThumbnailEnabled && hasCustomThumbnail;

  const fetchPreviewIds = useCallback(async () => {
    const previews = await getPreviewsArray(assetId);
    const previewIds = previews.map((preview: Preview) => parsePreviewIdFromPreview(preview));

    // Fetch asset type and moderation state for each preview in parallel
    const previewAssetDetails = await Promise.all(
      previewIds.map(
        async (
          previewId: number,
        ): Promise<{
          previewId: number;
          previewAssetType: AssetType | undefined;
          moderationState: ModerationState;
        }> => {
          try {
            const assetDetails = await assetsUploadApiClient.getAsset(
              previewId,
              PREVIEW_DETAILS_FIELD_MASK_ARRAY,
            );
            return {
              previewId,
              previewAssetType: assetDetails.assetType,
              moderationState:
                assetDetails.moderationResult?.moderationState ?? ModerationState.Unspecified,
            };
          } catch {
            throw new Error(translate('Error.UnknownError'));
          }
        },
      ),
    );

    const imagePreviewIds: number[] = [];
    let videoPreviewId: number | null = null;
    let videoModerationState: ModerationState = ModerationState.Unspecified;

    previewAssetDetails.forEach(({ previewId, previewAssetType, moderationState }) => {
      if (previewAssetType === AssetType.Image) {
        imagePreviewIds.push(previewId);
        return;
      }

      // Only use the first video preview ID; backend validates there's only one attached.
      if (!videoPreviewId && previewAssetType === videoPreviewType) {
        videoPreviewId = previewId;
        videoModerationState = moderationState;
      }
    });

    return { imagePreviewIds, videoPreviewId, videoModerationState };
  }, [assetId, translate, videoPreviewType]);

  const uploadPreview = useCallback(
    async (
      preview: File,
      previewAssetType: AssetType,
      existingImagePreviewIds: number[],
      existingVideoPreviewId: number | null,
    ) => {
      const isVideoUpload = previewAssetType === videoPreviewType;

      if (isVideoUpload) {
        videoUploadFileSizeRef.current = preview.size;
        videoUploadStartTimeRef.current = performance.now();
        resetVideoUploadProgress?.();
        unifiedLogger.logClickEvent(
          createStorePreviewVideoUploadStartEvent({
            assetId,
            fileSize: preview.size,
            creatorId,
          }),
        );
        await uploadPreviewVideoAsync({
          file: preview,
          existingImagePreviewIds,
          existingVideoPreviewId,
        });
        return;
      }

      // Image upload: create → poll → associate
      let imageCreator: Creator;
      switch (creatorType) {
        case CreatorType.Group:
          imageCreator = { groupId: creatorId };
          break;
        case CreatorType.User:
          imageCreator = { userId: creatorId };
          break;
        default:
          throw new Error(`Unsupported creator type: ${String(creatorType)}`);
      }
      const creationContext: CreationContext = { creator: imageCreator };

      let createOperationId: string;
      try {
        createOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
          {
            assetType: previewAssetType,
            displayName: `Preview for Asset: ${assetId}`,
            creationContext,
          },
          preview,
          true, // images need open-use label
        );
      } catch (error) {
        const httpStatus =
          hasStatus(error) && typeof error.status === 'number' ? error.status : undefined;
        trackerClient.sendEvent(
          assetCreationFailureEventModel(
            previewAssetType,
            creatorId,
            `parentAssetId:${assetId},stage:UPLOAD_INITIATION,code:${httpStatus ?? HttpStatusCodes.INTERNAL_SERVER_ERROR},message:Failed to initiate image upload`,
          ),
        );
        throw error;
      }

      let imageUploadStage = 'UPLOAD_POLLING';
      try {
        const createOperation = await pollForOperationAsync(createOperationId);
        imageUploadStage = 'UPLOAD_TRANSCODE';
        assertOperationResponse(createOperation);
        const newAssetId = parsePreviewIdFromPreview({
          asset: createOperation?.response?.path ?? '',
        });

        const combinedIds = combinePreviewIds(existingVideoPreviewId, [
          newAssetId,
          ...existingImagePreviewIds,
        ]);
        imageUploadStage = 'ASSOCIATION_INITIATION';
        const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
          assetId,
          PREVIEWS_FIELD_MASK_ARRAY,
          { assetId, previews: getPreviewsArrayFromPreviewIds(combinedIds) },
        );
        imageUploadStage = 'ASSOCIATION_POLLING';
        const updateOperation = await pollForOperationAsync(updateOperationId);
        imageUploadStage = 'ASSOCIATION_COMPLETION';
        assertOperationResponse(updateOperation);
      } catch (error) {
        const httpStatus =
          hasStatus(error) && typeof error.status === 'number' ? error.status : undefined;
        trackerClient.sendEvent(
          assetCreationFailureEventModel(
            previewAssetType,
            creatorId,
            `parentAssetId:${assetId},stage:${imageUploadStage},code:${httpStatus ?? HttpStatusCodes.INTERNAL_SERVER_ERROR},message:Image upload pipeline failed`,
          ),
        );
        throw error;
      }
    },
    [
      assetId,
      creatorId,
      creatorType,
      pollForOperationAsync,
      resetVideoUploadProgress,
      uploadPreviewVideoAsync,
      videoPreviewType,
      trackerClient,
      unifiedLogger,
    ],
  );

  const deletePreview = useCallback(
    async (
      previewId: number,
      existingImagePreviewIds: number[],
      existingVideoPreviewId: number | null,
    ) => {
      const combinedPreviewIds = combinePreviewIds(existingVideoPreviewId, existingImagePreviewIds);
      const newPreviewIds = combinedPreviewIds.filter((id) => id !== previewId);
      const newPreviews = getPreviewsArrayFromPreviewIds(newPreviewIds);

      // Update asset with new previews list
      const operationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
        assetId,
        PREVIEWS_FIELD_MASK_ARRAY,
        { assetId, previews: newPreviews },
      );
      const deleteOperation = await pollForOperationAsync(operationId);
      assertOperationResponse(deleteOperation);
    },
    [assetId, pollForOperationAsync],
  );

  const configurePreviews = useCallback(
    async (
      data: CreatorStoreConfigurationType,
      methods: UseFormReturn<CreatorStoreConfigurationType>,
    ) => {
      const hasImagePreviewChanges =
        !!methods.formState.dirtyFields.imagePreviewIds &&
        !!data.imagePreviewIds &&
        data.imagePreviewIds.length > 0;
      const hasVideoPreviewChanges = !!methods.formState.dirtyFields.videoPreviewId;
      const hasPreviewChanges = hasImagePreviewChanges || hasVideoPreviewChanges;

      if (hasPreviewChanges) {
        const combinedPreviewIds = combinePreviewIds(
          data.videoPreviewId ?? null,
          data.imagePreviewIds ?? [],
        );

        const previews = getPreviewsArrayFromPreviewIds(combinedPreviewIds);
        const operationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
          assetId,
          PREVIEWS_FIELD_MASK_ARRAY,
          { assetId, previews },
        );
        const configureOperation = await pollForOperationAsync(operationId);
        assertOperationResponse(configureOperation);

        methods.resetField('imagePreviewIds', { defaultValue: data.imagePreviewIds });
        methods.resetField('videoPreviewId', { defaultValue: data.videoPreviewId });
      }
    },
    [assetId, pollForOperationAsync],
  );

  const configureThumbnail = useCallback(
    async (
      data: CreatorStoreConfigurationType,
      methods: UseFormReturn<CreatorStoreConfigurationType>,
    ) => {
      const isUploadingThumbnail = Boolean(methods.formState.dirtyFields.file && data.file);
      const isRemovingThumbnail =
        isRemovingThumbnailEnabled &&
        Boolean(methods.formState.dirtyFields.removeCustomThumbnail && data.removeCustomThumbnail);

      if (!isUploadingThumbnail && !isRemovingThumbnail) {
        return;
      }

      if (isUploadingThumbnail) {
        const thumbnailFile = data.file;
        if (!thumbnailFile) {
          return;
        }

        if (assetType === Asset.Model) {
          let uploadedIconImageAssetId: number | null = null;
          try {
            let thumbnailCreator: Creator;
            switch (creatorType) {
              case CreatorType.Group:
                thumbnailCreator = { groupId: creatorId };
                break;
              case CreatorType.User:
                thumbnailCreator = { userId: creatorId };
                break;
              default:
                throw new Error(`Unsupported creator type: ${String(creatorType)}`);
            }
            const creationContext: CreationContext = { creator: thumbnailCreator };
            const uploadRequestInfo = {
              assetType: AssetType.Image,
              displayName: `Icon for Asset: ${assetId}`,
              creationContext,
            };
            const createOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
              uploadRequestInfo,
              thumbnailFile,
              true,
            );
            const uploadOperation = await pollForOperationAsync(createOperationId);

            const iconAssetIdFromResponse =
              uploadOperation?.response?.assetId ??
              parsePreviewIdFromPreview({ asset: uploadOperation?.response?.path ?? '' });
            if (!iconAssetIdFromResponse) {
              throw new Error(translate('Error.UnknownError'));
            }
            uploadedIconImageAssetId = iconAssetIdFromResponse;

            // If the uploaded thumbnail icon is rejected, throw
            const uploadModerationState =
              uploadOperation?.response?.moderationResult?.moderationState;
            if (uploadModerationState === ModerationState.Rejected) {
              throw new Error(translate('Message.ImageModerated'));
            }

            const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
              assetId,
              ICON_FIELD_MASK_ARRAY,
              { assetId, icon: `assets/${iconAssetIdFromResponse}` },
            );
            const iconUpdateOperation = await pollForOperationAsync(updateOperationId);
            assertOperationResponse(iconUpdateOperation);

            // If the uploaded thumbnail icon was not approved already, poll until approval or max retries
            if (uploadModerationState !== ModerationState.Approved) {
              await pollForAssetModerationApproval(iconAssetIdFromResponse);
            }

            methods.resetField('file');
            methods.resetField('removeCustomThumbnail', { defaultValue: false });
            setHasCustomThumbnail(true);
            refreshThumbnail();
            logCreatorStoreCustomThumbnailUpload({
              parentAssetType: assetType,
              assetId,
            });
          } catch (e) {
            let httpErrorCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
            let message = 'AssetCreationFailed';

            if (e instanceof Error) {
              message = e.message;
            } else {
              const parsed = await tryParseResponseError(e);
              if (parsed) {
                httpErrorCode = parsed.status;
                message = parsed.message;
              }
            }
            const assetIdSuffix =
              uploadedIconImageAssetId !== null ? `,assetId:${uploadedIconImageAssetId}` : '';
            trackerClient.sendEvent(
              assetCreationFailureEventModel(
                AssetType.Image,
                creatorId,
                `code:${httpErrorCode},message:${message}${assetIdSuffix}`,
              ),
            );
            throw e instanceof Error ? e : new Error(translate('Error.UnknownError'));
          }
        } else {
          try {
            await publishClient.patchPluginIcon(assetId, thumbnailFile);
            methods.resetField('file');
            refreshThumbnail();
            logCreatorStoreCustomThumbnailUpload({
              parentAssetType: assetType,
              assetId,
            });
          } catch (e) {
            const code = getErrorCode(e);
            let errorKey = 'Error.UnknownError';
            if (code && Object.values(PublishError).includes(code)) {
              errorKey = publishErrorDescription[code as PublishError] ?? 'Error.UnknownError';
            }
            const errorReason = translate(errorKey);
            throw new Error(errorReason, { cause: e });
          }
        }
        return;
      }

      // Reaching this block means that the thumbnail is being removed
      try {
        const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
          assetId,
          ICON_FIELD_MASK_ARRAY,
          { assetId, icon: '' }, // Empty string removes the icon
        );
        const removeOperation = await pollForOperationAsync(updateOperationId);
        assertOperationResponse(removeOperation);

        methods.resetField('removeCustomThumbnail', { defaultValue: false });
        setHasCustomThumbnail(false);
        refreshThumbnail();
      } catch (e) {
        if (e instanceof Error) {
          throw e;
        }
        const parsed = await tryParseResponseError(e);
        if (parsed) {
          throw new Error(parsed.message, { cause: e });
        }
        throw new Error(translate('Error.UnknownError'), { cause: e });
      }
    },
    [
      assetId,
      assetType,
      creatorId,
      creatorType,
      isRemovingThumbnailEnabled,
      pollForAssetModerationApproval,
      pollForOperationAsync,
      refreshThumbnail,
      translate,
      trackerClient,
    ],
  );

  return {
    arePreviewsEnabled,
    areVideoPreviewsEnabled,
    isConfiguringThumbnailEnabled,
    isRemovingThumbnailEnabled,
    hasRemovableThumbnail,
    fetchPreviewIds,
    uploadPreview,
    deletePreview,
    configurePreviews,
    configureThumbnail,
  };
};

export default usePreviews;
