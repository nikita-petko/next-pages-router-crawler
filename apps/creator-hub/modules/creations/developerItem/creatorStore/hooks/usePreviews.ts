import { useCallback, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import { publishClient, getErrorCode, tryParseResponseError } from '@modules/clients';
import { Asset, PublishError, HttpStatusCodes } from '@modules/miscellaneous/common';
import publishErrorDescription from '@modules/miscellaneous/common/constants/publishErrorDescription';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import {
  AssetType,
  CreationContext,
  Creator,
  Preview,
  ModerationState,
} from '@rbx/clients/assetsUploadApi';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import CreatorType from '@modules/miscellaneous/common/enums/Creator';
import { assetCreationFailureEventModel } from '@modules/asset-creation/constants/eventConstants';
import type { CreatorStoreConfigurationType } from '../components/CreatorStoreConfiguration/CreatorStoreConfiguration';
import useAssetsUploadApiOperationPolling from './useAssetsUploadApiOperationPolling';

const PREVIEW_DETAILS_FIELD_MASK_ARRAY = [FieldMask.ASSET_TYPE, FieldMask.MODERATION_RESULT];
const PREVIEWS_FIELD_MASK_ARRAY = [FieldMask.PREVIEWS];
const SUPPORTED_PREVIEW_ASSET_TYPES = [Asset.MeshPart, Asset.Model, Asset.Plugin];

export interface FetchPreviewIdsResponse {
  imagePreviewIds: number[];
  videoPreviewId: number | null;
  videoModerationState: ModerationState;
}

export interface PreviewsContext {
  arePreviewsEnabled: boolean;
  areVideoPreviewsEnabled: boolean;
  isConfiguringThumbnailEnabled: boolean;
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
  const { trackerClient } = useEventTrackerProvider();

  const arePreviewsEnabled = useMemo(() => {
    return SUPPORTED_PREVIEW_ASSET_TYPES.includes(assetType);
  }, [assetType]);

  // Keep a dedicated video-enabled flag for:
  // 1) Backwards compatibility with existing consumers expecting a video-specific toggle
  // 2) Future flexibility to reintroduce separate gating for video previews without API changes
  const areVideoPreviewsEnabled = arePreviewsEnabled;

  const isConfiguringThumbnailEnabled = useMemo(() => {
    return assetType === Asset.Plugin;
  }, [assetType]);

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
      const hasPreviewChanges =
        (methods.formState.dirtyFields.imagePreviewIds &&
          data.imagePreviewIds &&
          data.imagePreviewIds.length > 0) ||
        methods.formState.dirtyFields.videoPreviewId;

      if (hasPreviewChanges) {
        // Combine video and image preview IDs using helper function
        const combinedPreviewIds = combinePreviewIds(
          data.videoPreviewId ?? null,
          data.imagePreviewIds ?? [],
        );

        try {
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
        } catch (e) {
          return Promise.reject(e);
        }
      }
      return Promise.resolve();
    },
    [assetId, pollForCompletedOperation],
  );

  const configureThumbnail = useCallback(
    async (
      data: CreatorStoreConfigurationType,
      methods: UseFormReturn<CreatorStoreConfigurationType>,
    ) => {
      if (methods.formState.dirtyFields.file && data.file) {
        try {
          await publishClient.patchPluginIcon(assetId, data.file);
          methods.resetField('file');
          refreshThumbnail();
        } catch (e) {
          const code = getErrorCode(e);
          let errorKey = 'Error.UnknownError';
          if (code && Object.values(PublishError).includes(code)) {
            errorKey = publishErrorDescription[code as PublishError] ?? 'Error.UnknownError';
          }
          const errorReason = translate(errorKey);
          return Promise.reject(new Error(errorReason));
        }
      }
      return Promise.resolve();
    },
    [assetId, refreshThumbnail, translate],
  );

  return {
    arePreviewsEnabled,
    areVideoPreviewsEnabled,
    isConfiguringThumbnailEnabled,
    fetchPreviewIds,
    uploadPreview,
    deletePreview,
    configurePreviews,
    configureThumbnail,
  };
};

export default usePreviews;
