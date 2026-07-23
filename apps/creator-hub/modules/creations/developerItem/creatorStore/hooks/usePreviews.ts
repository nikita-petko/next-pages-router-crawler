import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CreationContext, Creator, Preview } from '@rbx/client-assets-upload-api/v1';
import { AssetType, ModerationState } from '@rbx/client-assets-upload-api/v1';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import { isModelCustomThumbnailUploadEnabled } from '@generated/flags/contentAccessAndInventory';
import { assetCreationFailureEventModel } from '@modules/asset-creation/constants/eventConstants';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import publishClient from '@modules/clients/publish';
import { getErrorCode } from '@modules/clients/utils/errorHelpers';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { Asset, PublishError, HttpStatusCodes } from '@modules/miscellaneous/common';
import publishErrorDescription from '@modules/miscellaneous/common/constants/publishErrorDescription';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { logCreatorStoreCustomThumbnailUpload } from '../analytics';
import type { CreatorStoreConfigurationType } from '../components/CreatorStoreConfiguration/types';
import useAssetsUploadApiModerationPolling from './useAssetsUploadApiModerationPolling';
import useAssetsUploadApiOperationPolling from './useAssetsUploadApiOperationPolling';

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

const getPreviewsArray = async (assetId: number) => {
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
): PreviewsContext => {
  const { translate } = useTranslation();
  const { pollForCompletedOperation } = useAssetsUploadApiOperationPolling(180); // 3 minutes max retries
  const { pollForAssetModerationApproval } = useAssetsUploadApiModerationPolling();
  const { trackerClient } = useEventTrackerProvider();

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
    const previewIds = previews.map((preview) => parsePreviewIdFromPreview(preview));

    // Check each preview's asset type and fetch moderation status for videos
    const previewAssetDetails = await Promise.all(
      previewIds.map(async (previewId) => {
        try {
          const assetDetails = await assetsUploadApiClient.getAsset(
            previewId,
            PREVIEW_DETAILS_FIELD_MASK_ARRAY,
          );
          return { previewId, assetType: assetDetails.assetType, assetDetails };
        } catch {
          throw new Error(translate('Error.UnknownError'));
        }
      }),
    );

    const imagePreviewIds: number[] = [];
    let videoPreviewId: number | null = null;
    let videoModerationState: ModerationState = ModerationState.Unspecified;

    previewAssetDetails.forEach(({ previewId, assetType: previewAssetType, assetDetails }) => {
      if (previewAssetType === AssetType.Image) {
        imagePreviewIds.push(previewId);
        return;
      }

      // Only use the first video preview ID; backend validates there's only one attached.
      if (!videoPreviewId && previewAssetType === videoPreviewType) {
        videoPreviewId = previewId;
        videoModerationState =
          assetDetails?.moderationResult?.moderationState ?? ModerationState.Unspecified;
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
      let uploadedAssetId: number | null = null;
      try {
        // Create new preview asset (unconnected to parent asset)
        const isGroupAsset = creatorType === CreatorType.Group;
        const creator: Creator = isGroupAsset ? { groupId: creatorId } : { userId: creatorId };
        const creationContext: CreationContext = { creator };
        const uploadRequestInfo = {
          assetType: previewAssetType,
          displayName: `Preview for Asset: ${assetId}`, // Will not be displayed
          creationContext,
        };
        const setAssetPrivacyToOpenUse = previewAssetType === AssetType.Image; // Images need open use label, videos don't
        const createOperationId = await assetsUploadApiClient.createAssetAndGetOperationId(
          uploadRequestInfo,
          preview as Blob,
          setAssetPrivacyToOpenUse,
        );
        await pollForCompletedOperation(createOperationId);

        // Get existing previews and new preview
        const uploadOperation = await assetsUploadApiClient.getOperationStatus(createOperationId);
        const uploadedAssetPath = uploadOperation?.response?.path;
        if (uploadedAssetPath === undefined) {
          throw new Error(translate('Error.UnknownError'));
        }
        const newPreview: Preview = { asset: uploadedAssetPath };
        const newAssetId = parsePreviewIdFromPreview(newPreview);
        uploadedAssetId = newAssetId;

        let combinedPreviews: Preview[];
        if (previewAssetType === videoPreviewType) {
          // Video upload: new video first, then existing images
          const combinedIds = combinePreviewIds(newAssetId, existingImagePreviewIds);
          combinedPreviews = getPreviewsArrayFromPreviewIds(combinedIds);
        } else {
          // Image upload: existing video first (if any), then new image, then existing images
          const combinedIds = combinePreviewIds(existingVideoPreviewId, [
            newAssetId,
            ...existingImagePreviewIds,
          ]);
          combinedPreviews = getPreviewsArrayFromPreviewIds(combinedIds);
        }

        const updateRequestInfo = {
          assetId,
          previews: combinedPreviews,
        };

        // Update asset with new previews list
        const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
          assetId,
          PREVIEWS_FIELD_MASK_ARRAY,
          updateRequestInfo,
        );
        await pollForCompletedOperation(updateOperationId);
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
        const assetIdSuffix = uploadedAssetId !== null ? `,assetId:${uploadedAssetId}` : '';
        trackerClient.sendEvent(
          assetCreationFailureEventModel(
            previewAssetType,
            creatorId,
            `code:${httpErrorCode},message:${message}${assetIdSuffix}`,
          ),
        );
        throw e;
      }
    },
    [
      assetId,
      creatorId,
      creatorType,
      pollForCompletedOperation,
      translate,
      videoPreviewType,
      trackerClient,
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

      const requestInfo = {
        assetId,
        previews: newPreviews,
      };

      // Update asset with new previews list
      const operationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
        assetId,
        PREVIEWS_FIELD_MASK_ARRAY,
        requestInfo,
      );
      await pollForCompletedOperation(operationId);
    },
    [assetId, pollForCompletedOperation],
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
        const requestInfo = {
          assetId,
          previews,
        };
        const operationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
          assetId,
          PREVIEWS_FIELD_MASK_ARRAY,
          requestInfo,
        );
        await pollForCompletedOperation(operationId);

        methods.resetField('imagePreviewIds', { defaultValue: data.imagePreviewIds });
        methods.resetField('videoPreviewId', { defaultValue: data.videoPreviewId });
      }
    },
    [assetId, pollForCompletedOperation],
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
            const isGroupAsset = creatorType === CreatorType.Group;
            const creator: Creator = isGroupAsset ? { groupId: creatorId } : { userId: creatorId };
            const creationContext: CreationContext = { creator };
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
            await pollForCompletedOperation(createOperationId);

            const uploadOperation =
              await assetsUploadApiClient.getOperationStatus(createOperationId);
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

            const updateRequestInfo = {
              assetId,
              icon: `assets/${iconAssetIdFromResponse}`,
            };
            const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
              assetId,
              ICON_FIELD_MASK_ARRAY,
              updateRequestInfo,
            );
            await pollForCompletedOperation(updateOperationId);

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
        const updateRequestInfo = {
          assetId,
          icon: '', // Empty string removes the icon
        };
        const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
          assetId,
          ICON_FIELD_MASK_ARRAY,
          updateRequestInfo,
        );
        await pollForCompletedOperation(updateOperationId);

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
      pollForCompletedOperation,
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
