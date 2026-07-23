import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { captureMessage } from '@sentry/nextjs';
import { FormProvider, useForm } from 'react-hook-form';
import { AssetType, ModerationState } from '@rbx/client-assets-upload-api/v1';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Link, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import {
  ROBLOX_COMMUNITY_STANDARDS,
  ROBLOX_TERMS_OF_USE,
} from '@modules/miscellaneous/common/constants/linkConstants';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import UploadVideoPreviewsForm from '../../developerItem/common/UploadVideoPreviewsForm/UploadVideoPreviewsForm';
import {
  createVideoUploadFailureEvent,
  createVideoUploadStartEvent,
  createVideoUploadSuccessEvent,
} from '../constants/videoEventConstants';
import useDisassociateAssetFromPlaceMutation from '../hooks/useDisassociateAssetFromPlaceMutation';
import useGamePreviewVideoForPlaceQuery from '../hooks/useGamePreviewVideoForPlaceQuery';
import type { PollingConfig, ProgressCallbacks } from '../hooks/useUploadAssetForPlaceMutation';
import useUploadAssetForPlaceMutation from '../hooks/useUploadAssetForPlaceMutation';
import {
  getVideoUploadDisplayModerationState,
  VideoContentQualityReviewStatus,
} from '../utils/videoReviewStatusUtils';
import VideoQualityRejectionMessage from './VideoQualityRejectionMessage';

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
  isUploadDisabled?: boolean;
  uploadButtonTooltip?: FormattedText;
  hideTitle?: boolean;
};

const VideoUploadWrapper: FC<VideoUploadWrapperProps> = ({
  placeId,
  userId,
  isUploadDisabled,
  uploadButtonTooltip,
  hideTitle,
}) => {
  const { translate } = useTranslation();
  const methods = useForm<{ videoPreviewId: number | null }>({
    defaultValues: {
      videoPreviewId: null,
    },
  });

  const { gameDetails } = useCurrentGame();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const {
    data: currentVideoPreview,
    isFetching: isVideoPreviewFetching,
    isError: isVideoPreviewFetchError,
    refetch: refetchCurrentVideoPreview,
  } = useGamePreviewVideoForPlaceQuery(placeId, gameDetails?.id, {
    enabled: true,
    shouldFetchContentQuality: true,
  });

  const videoPreviewId = currentVideoPreview?.videoPreviewId ?? null;
  const fetchedModerationState =
    currentVideoPreview?.moderationState ?? ModerationState.Unspecified;
  const videoContentQualityReviewStatus = currentVideoPreview?.videoContentQualityReviewStatus;

  const [moderationOverride, setModerationOverride] = useState<ModerationState | null>(null);

  // Allow for optimistic override of moderation state after submission
  const videoModerationState =
    moderationOverride ??
    getVideoUploadDisplayModerationState(fetchedModerationState, videoContentQualityReviewStatus);

  const [uploadProgress, setUploadProgress] = useState(0);
  const currentFileSize = useRef<number>(0);
  const startTime = useRef<number>(0);

  const creatorType = gameDetails?.creator?.type;
  const isGroupUpload = creatorType === 'Group';
  const groupId = gameDetails?.creator?.id;

  // Update form state when videoPreviewId changes.
  useEffect(() => {
    methods.reset({
      videoPreviewId,
    });
  }, [videoPreviewId, methods]);

  const onUploadSuccess = useCallback(() => {
    setModerationOverride(ModerationState.Reviewing);
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
        setModerationOverride(ModerationState.Unspecified);
        await refetchCurrentVideoPreview();
      } catch (error) {
        captureMessage(`VideoUploadWrapper: Failed to delete preview for place ${placeId}`, {
          level: 'error',
          extra: {
            error,
          },
        });
      } finally {
        setModerationOverride(null);
      }
    },
    [disassociateAssetFromPlaceAsync, placeId, refetchCurrentVideoPreview],
  );

  const handleVideoUploadComplete = useCallback((): void => {
    setModerationOverride(ModerationState.Reviewing);
  }, []);

  const handleRefetchPreviewIds = useCallback(async (): Promise<void> => {
    try {
      await refetchCurrentVideoPreview();
    } catch (error) {
      captureMessage(`VideoUploadWrapper: Failed to refetch preview IDs for place ${placeId}`, {
        level: 'error',
        extra: {
          error,
        },
      });
    } finally {
      setModerationOverride(null);
    }
  }, [refetchCurrentVideoPreview, placeId]);

  const handleReloadCurrentVideoPreview = useCallback(async (): Promise<void> => {
    void refetchCurrentVideoPreview();
  }, [refetchCurrentVideoPreview]);

  const videoRejectionMessageOverride = useMemo(() => {
    if (
      moderationOverride === null &&
      fetchedModerationState === ModerationState.Approved &&
      videoContentQualityReviewStatus === VideoContentQualityReviewStatus.Failed
    ) {
      // Show the content quality rejection message when moderation approved but content quality failed
      return <VideoQualityRejectionMessage />;
    }

    return undefined;
  }, [fetchedModerationState, moderationOverride, videoContentQualityReviewStatus]);

  if (isVideoPreviewFetching) {
    return <CircularProgress data-testid='video-upload-wrapper-loading' />;
  }

  if (isVideoPreviewFetchError) {
    return (
      <FailureView
        // TranslationNamespace.Error
        title={translate('Heading.FailedToLoadPage')}
        // TranslationNamespace.Error
        message={translate('Message.FailedToLoadPage')}
        // TranslationNamespace.Error
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReloadCurrentVideoPreview}
      />
    );
  }

  return (
    <FormProvider {...methods}>
      <UploadVideoPreviewsForm
        uploadPreview={handleUploadPreview}
        deletePreview={handleDeletePreview}
        videoModerationState={videoModerationState}
        videoRejectionMessageOverride={videoRejectionMessageOverride}
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
        hideTitle={hideTitle}
      />
    </FormProvider>
  );
};

export default VideoUploadWrapper;
