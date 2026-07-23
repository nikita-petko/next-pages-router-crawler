import { FormattedText } from '@modules/analytics-translations';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import { contentQualityClient } from '@modules/clients';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { captureMessage } from '@sentry/nextjs';
import {
  ROBLOX_COMMUNITY_STANDARDS,
  ROBLOX_TERMS_OF_USE,
} from '@modules/miscellaneous/common/constants/linkConstants';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { AssetType, ModerationState, Preview } from '@rbx/clients/assetsUploadApi';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Link, Typography } from '@rbx/ui';
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import UploadVideoPreviewsForm from '../../developerItem/common/UploadVideoPreviewsForm/UploadVideoPreviewsForm';
import {
  createVideoUploadFailureEvent,
  createVideoUploadStartEvent,
  createVideoUploadSuccessEvent,
} from '../constants/videoEventConstants';
import useDisassociateAssetFromPlaceMutation from '../hooks/useDisassociateAssetFromPlaceMutation';
import useUploadAssetForPlaceMutation, {
  PollingConfig,
  ProgressCallbacks,
} from '../hooks/useUploadAssetForPlaceMutation';

const PREVIEW_DETAILS_FIELD_MASK_ARRAY = [FieldMask.ASSET_TYPE, FieldMask.MODERATION_RESULT];
const PREVIEWS_FIELD_MASK_ARRAY = [FieldMask.PREVIEWS];
const VIDEO_ASSET_TYPE = AssetType.GamePreviewVideo;
const MAX_FILE_SIZE_MB = 100;
const MAX_RESOLUTION = { width: 1920, height: 1080 };
const MIN_RESOLUTION = { width: 640, height: 360 };

const VIDEO_UPLOAD_POLLING_CONFIG: PollingConfig = {
  maxPolls: 1800, // poll for an hour max since upload can take a while
  pollInterval: 2000,
};

const EXPERIENCE_GUIDELINES_LINKS =
  'https://create.roblox.com/docs/production/publishing/thumbnails#videos';

const VideoUploadGuidelines: FC = () => {
  const { translateHTML } = useTranslation();

  const linkTags = [
    {
      opening: 'experienceGuidelinesStart',
      closing: 'experienceGuidelinesEnd',
      content(chunks: React.ReactNode) {
        return (
          <Link href={EXPERIENCE_GUIDELINES_LINKS} target='_blank' underline='always'>
            {chunks}
          </Link>
        );
      },
    },
    {
      opening: 'communityRulesStart',
      closing: 'communityRulesEnd',
      content(chunks: React.ReactNode) {
        return (
          <Link href={ROBLOX_COMMUNITY_STANDARDS} target='_blank' underline='always'>
            {chunks}
          </Link>
        );
      },
    },
    {
      opening: 'termsOfUseStart',
      closing: 'termsOfUseEnd',
      content(chunks: React.ReactNode) {
        return (
          <Link href={ROBLOX_TERMS_OF_USE} target='_blank' underline='always'>
            {chunks}
          </Link>
        );
      },
    },
  ];

  return (
    <Typography variant='body2' color='secondary'>
      {translateHTML('Label.VideoUploadGuidelines', linkTags)}
    </Typography>
  );
};

type VideoUploadWrapperProps = {
  placeId: number;
  userId: number;
  onVideoPreviewChange?: (videoPreview: Preview | undefined) => void;
  isUploadDisabled?: boolean;
  uploadButtonTooltip?: FormattedText;
};

const VideoUploadWrapper: FC<VideoUploadWrapperProps> = ({
  placeId,
  userId,
  onVideoPreviewChange,
  isUploadDisabled,
  uploadButtonTooltip,
}) => {
  const { translate } = useTranslation();
  const methods = useForm<{ videoPreviewId: number | null }>({
    defaultValues: {
      videoPreviewId: null,
    },
  });

  const [videoPreviewId, setVideoPreviewId] = useState<number | null>(null);
  const [videoModerationState, setVideoModerationState] = useState<ModerationState>(
    ModerationState.Unspecified,
  );
  const [videoHumanEvaluationState, setVideoHumanEvaluationState] = useState<ModerationState>(
    ModerationState.Unspecified,
  );
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const currentFileSize = useRef<number>(0);
  const startTime = useRef<number>(0);

  // Combined moderation state that considers both Assets API and human evaluation
  const combinedModerationState = useMemo(() => {
    // If Assets API shows rejected, always show rejected regardless of human evaluation
    if (videoModerationState === ModerationState.Rejected) {
      return ModerationState.Rejected;
    }

    // If Assets API shows approved, check human evaluation
    if (videoModerationState === ModerationState.Approved) {
      if (videoHumanEvaluationState === ModerationState.Approved) {
        return ModerationState.Approved;
      }
      if (videoHumanEvaluationState === ModerationState.Rejected) {
        return ModerationState.Rejected;
      }
      // humanEvaluationState === 'pending'
      return ModerationState.Reviewing;
    }

    // For any other Assets API state (Unspecified, Reviewing, etc.), show as reviewing
    return ModerationState.Reviewing;
  }, [videoModerationState, videoHumanEvaluationState]);

  const { gameDetails } = useCurrentGame();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const creatorType = gameDetails?.creator?.type;
  const isGroupUpload = creatorType === 'Group';
  const groupId = gameDetails?.creator?.id;

  const fetchPreviewIds = useCallback(
    async (placeIdArg: number): Promise<void> => {
      let fetchedVideoPreview: Preview | undefined;
      let fetchedVideoPreviewId: number | null = null;
      let fetchedVideoModerationState: ModerationState = ModerationState.Unspecified;
      let fetchedVideoHumanEvaluationState: ModerationState = ModerationState.Unspecified;

      try {
        const data = await assetsUploadApiClient.getAsset(placeIdArg, PREVIEWS_FIELD_MASK_ARRAY);
        const previews = data.previews ?? [];
        const previewIds = previews
          .map((preview) => {
            const assetNumber = preview.asset?.split('/')[1];
            return assetNumber ? Number(assetNumber) : undefined;
          })
          .filter((id) => id !== undefined);

        // Check each preview's asset type and fetch moderation status for video types.
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

        previewAssetDetails.forEach(({ previewId, assetType: previewAssetType, assetDetails }) => {
          // Only use the first video preview ID; backend validates there's only one attached.
          if (!fetchedVideoPreviewId && previewAssetType === VIDEO_ASSET_TYPE) {
            // Find the matching preview from the original place asset previews fetch
            // assetDetails.preview is not populated for Game Preview Video assets
            const matchingPreview = previews.find((preview) => {
              const assetNumber = preview.asset?.split('/')[1];
              return assetNumber ? Number(assetNumber) === previewId : false;
            });
            fetchedVideoPreview = matchingPreview;
            fetchedVideoPreviewId = previewId;
            fetchedVideoModerationState =
              assetDetails?.moderationResult?.moderationState ?? ModerationState.Unspecified;
          }
        });

        // Fetch human evaluation status from Content Quality API if we have a video preview
        if (fetchedVideoPreviewId !== null && gameDetails?.id) {
          try {
            const contentQualityResponse = await contentQualityClient.getThumbnailSignals(
              gameDetails.id,
              [fetchedVideoPreviewId],
            );

            const videoAssetId = String(fetchedVideoPreviewId);
            const videoSignal = contentQualityResponse.assetResults?.[videoAssetId];

            if (videoSignal?.isAuthenticVideo === true) {
              fetchedVideoHumanEvaluationState = ModerationState.Approved;
            } else if (videoSignal?.isAuthenticVideo === false) {
              fetchedVideoHumanEvaluationState = ModerationState.Rejected;
            } else {
              // Field is absent or undefined - treat as pending
              fetchedVideoHumanEvaluationState = ModerationState.Unspecified;
            }
          } catch (error) {
            captureMessage(
              `VideoUploadWrapper: Failed to fetch human evaluation data for place ${placeIdArg}`,
              {
                level: 'error',
                extra: {
                  error,
                },
              },
            );
            // Keep as pending on error
            fetchedVideoHumanEvaluationState = ModerationState.Unspecified;
          }
        }
      } catch (error) {
        captureMessage(
          `VideoUploadWrapper: Failed to fetch preview video data for place ${placeIdArg}`,
          {
            level: 'error',
            extra: {
              error,
            },
          },
        );
      }

      onVideoPreviewChange?.(fetchedVideoPreview);
      setVideoPreviewId(fetchedVideoPreviewId);
      setVideoModerationState(fetchedVideoModerationState);
      setVideoHumanEvaluationState(fetchedVideoHumanEvaluationState);
    },
    [translate, onVideoPreviewChange, gameDetails?.id],
  );

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setIsInitializing(true);
        await fetchPreviewIds(placeId);
      } catch {
        captureMessage(
          `VideoUploadWrapper: Failed to fetch initial EDP video preview data for place ${placeId}`,
          {
            level: 'error',
          },
        );
      } finally {
        setIsInitializing(false);
      }
    }

    fetchInitialData();
  }, [placeId, fetchPreviewIds]);

  // Update form state when videoPreviewId changes.
  useEffect(() => {
    methods.reset({
      videoPreviewId,
    });
  }, [videoPreviewId, methods]);

  const onUploadSuccess = useCallback(() => {
    setVideoModerationState(ModerationState.Reviewing);
    setUploadProgress(0);

    const duration = Date.now() - startTime.current;
    unifiedLogger.logImpressionEvent(
      createVideoUploadSuccessEvent({
        fileSize: currentFileSize.current,
        creatorId: userId,
        duration,
      }),
    );
  }, [unifiedLogger, userId]);

  const progressCallbacks: ProgressCallbacks = useMemo(
    () => ({
      // Phase 1: Multipart upload (0-35%)
      onMultipartUploadProgress: (progress: number) => {
        setUploadProgress(progress * 0.35); // Map 0-100% to 0-35%
      },
      // Phase 2: Upload operation polling (35-90%)
      onUploadOperationPollProgress: (progress: number) => {
        setUploadProgress(35 + progress * 0.55); // Map 0-100% to 35-90%
      },
      // Phase 3: Associate operation polling (90-100%)
      onAssociateOperationPollProgress: (progress: number) => {
        setUploadProgress(90 + progress * 0.1); // Map 0-100% to 90-100%
      },
    }),
    [setUploadProgress],
  );

  const onUploadError = useCallback(
    (reason: string) => {
      setUploadProgress(0);
      unifiedLogger.logImpressionEvent(
        createVideoUploadFailureEvent({
          fileSize: 0, // Not available in error callback
          creatorId: userId,
          error: reason,
        }),
      );
    },
    [unifiedLogger, userId],
  );

  const { uploadAssetForPlaceAsync } = useUploadAssetForPlaceMutation(
    placeId,
    userId,
    groupId,
    isGroupUpload,
    onUploadSuccess,
    onUploadError,
    true, // useMultipartUpload
    VIDEO_UPLOAD_POLLING_CONFIG,
    progressCallbacks,
  );

  const { disassociateAssetFromPlaceAsync } = useDisassociateAssetFromPlaceMutation(placeId);

  const handleUploadPreview = useCallback(
    async (file: File, fileAssetType: AssetType): Promise<void> => {
      currentFileSize.current = file.size;
      startTime.current = Date.now();

      unifiedLogger.logClickEvent(
        createVideoUploadStartEvent({
          fileSize: file.size,
          creatorId: userId,
        }),
      );

      try {
        setUploadProgress(0);
        // NOTE: Game Preview Video price is free; we need to update and fetch price if it is ever made configurable.
        const price = 0;
        await uploadAssetForPlaceAsync({
          file,
          assetType: fileAssetType,
          price,
          setAssetPrivacyToOpenUse: false,
          displayName: `Game Preview Video: ${placeId}`,
        });
      } catch (error) {
        setUploadProgress(0);
        captureMessage(`VideoUploadWrapper: Failed to upload preview for place ${placeId}`, {
          level: 'error',
          extra: {
            error,
          },
        });
        throw error;
      }
    },
    [uploadAssetForPlaceAsync, placeId, unifiedLogger, userId],
  );

  const handleDeletePreview = useCallback(
    async (videoId: number): Promise<void> => {
      try {
        await disassociateAssetFromPlaceAsync(videoId);
        // Reset states after deletion - form will update automatically via useEffect
        setVideoPreviewId(null);
        setVideoModerationState(ModerationState.Unspecified);
        setVideoHumanEvaluationState(ModerationState.Unspecified);
        onVideoPreviewChange?.(undefined);
      } catch (error) {
        captureMessage(`VideoUploadWrapper: Failed to delete preview for place ${placeId}`, {
          level: 'error',
          extra: {
            error,
          },
        });
      }
    },
    [disassociateAssetFromPlaceAsync, placeId, onVideoPreviewChange],
  );

  const handleVideoUploadComplete = useCallback((): void => {
    setVideoModerationState(ModerationState.Reviewing);
    setVideoHumanEvaluationState(ModerationState.Unspecified);
  }, []);

  const handleRefetchPreviewIds = useCallback(async (): Promise<void> => {
    try {
      await fetchPreviewIds(placeId);
    } catch (error) {
      captureMessage(`VideoUploadWrapper: Failed to refetch preview IDs for place ${placeId}`, {
        level: 'error',
        extra: {
          error,
        },
      });
    }
  }, [fetchPreviewIds, placeId]);

  if (isInitializing) {
    return <CircularProgress data-testid='video-upload-wrapper-loading' />;
  }

  return (
    <FormProvider {...methods}>
      <UploadVideoPreviewsForm
        uploadPreview={handleUploadPreview}
        deletePreview={handleDeletePreview}
        videoModerationState={combinedModerationState}
        videoType={VIDEO_ASSET_TYPE}
        onVideoUploadComplete={handleVideoUploadComplete}
        refetchPreviewIds={handleRefetchPreviewIds}
        maxFileSizeMB={MAX_FILE_SIZE_MB}
        maxResolution={MAX_RESOLUTION}
        minResolution={MIN_RESOLUTION}
        showProgress
        progressMessage={
          <Typography variant='body2' color='error' data-testid='video-upload-progress-message'>
            {translate('Label.WaitTillVideoUploadFinishesDisclaimer')}
          </Typography>
        }
        hideLimitDescription
        progress={uploadProgress}
        noticeMessage={<VideoUploadGuidelines />}
        showBitrateRecommendation
        isUploadDisabled={isUploadDisabled}
        uploadButtonTooltip={uploadButtonTooltip}
      />
    </FormProvider>
  );
};

export default VideoUploadWrapper;
