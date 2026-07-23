import { Icon, IconButton, ProgressCircle } from '@rbx/foundation-ui';
import { Grid } from '@rbx/ui';
import { RobloxVideoPlayer } from '@rbx/video-player';
import React, { useCallback, useMemo } from 'react';

import useVideoUploadCardStyles from '@components/campaignBuilder/common/creative/videoSection/VideoUploadCard.styles';
import { openVideoPlayerDialog } from '@components/common/dialogs/VideoPlayerDialog';
import { FALLBACK_ASPECT_RATIO, FALLBACK_VIDEO_FILE_NAME } from '@constants/fileUpload';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { UploadedVideoType, VideoUploadState } from '@type/fileUpload';
import { GetAspectRatio, VideoURLManager } from '@utils/fileUpload';
import { GetVideoPlayerEnvEnum } from '@utils/url';

const STATUS_COLOR_CLASS: Record<'error' | 'primary' | 'secondary', string> = {
  error: 'content-system-alert',
  primary: 'content-emphasis',
  secondary: 'content-default',
};

interface VideoUploadCardProps {
  allUploadedVideos?: UploadedVideoType[];
  disabled?: boolean;
  isStaged?: boolean;
  onCancel?: () => void;
  onRemove: () => void;
  onRetry?: () => void;
  video: UploadedVideoType;
}

const VideoUploadCard: React.FC<VideoUploadCardProps> = ({
  allUploadedVideos = [],
  disabled = false,
  isStaged = false,
  onCancel,
  onRemove,
  onRetry,
  video,
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: {
      actionButton,
      cardContainer,
      contentContainer,
      fileName: fileNameClass,
      placeholder,
      statusIconContainer,
      statusIconGrid,
      statusText,
      statusTextContainer,
      thumbnailContainer,
      thumbnailContainerClickable,
      videoThumbnail,
    },
  } = useVideoUploadCardStyles();

  const isUploading = video.state === VideoUploadState.UPLOADING;
  const isError = video.state === VideoUploadState.ERROR;
  const isFinished = video.state === VideoUploadState.FINISHED;

  const statusDetails = useMemo(() => {
    if (isUploading) {
      return {
        color: 'primary' as const,
        icon: (
          <ProgressCircle
            ariaLabel={translateMisc('Label.Loading')}
            size='Small'
            variant='Indeterminate'
          />
        ),
        text: translate('Description.UploadingProgress', {
          progress: String(Math.round(video.progress || 0)),
        }),
      };
    }
    if (isError) {
      return {
        color: 'error' as const,
        icon: (
          <Icon
            className='content-system-alert'
            name='icon-filled-triangle-exclamation'
            size='Small'
          />
        ),
        text: video.error,
      };
    }
    if (isStaged || video.state === VideoUploadState.STAGED) {
      return {
        color: 'secondary' as const,
        text: translate('Description.ReadyToUpload'),
      };
    }
    if (isFinished) {
      const aspectRatio =
        video.width && video.height
          ? GetAspectRatio(video.width, video.height)
          : FALLBACK_ASPECT_RATIO;

      let durationText = '';
      if (video.duration !== undefined && video.duration !== null) {
        const durationValue =
          typeof video.duration === 'string' ? parseFloat(video.duration) : video.duration;
        if (!Number.isNaN(durationValue) && durationValue >= 0) {
          const displayDuration = durationValue < 0.5 ? 1 : Math.round(durationValue);
          durationText = `${displayDuration}s`;
        }
      }

      const displayText = durationText
        ? translate('Description.AspectRatioAndDuration', {
            duration: durationText,
            ratio: aspectRatio,
          })
        : translate('Description.AspectRatio', { ratio: aspectRatio });

      return {
        color: 'secondary' as const,
        icon: (
          <Icon className='content-system-success' name='icon-filled-circle-check' size='Small' />
        ),
        text: displayText,
      };
    }
    return null;
  }, [
    video.state,
    isUploading,
    isError,
    isStaged,
    isFinished,
    video.progress,
    video.error,
    video.duration,
    video.width,
    video.height,
    translate,
    translateMisc,
  ]);

  const handleAction = useCallback(() => {
    if (isUploading && onCancel) {
      onCancel();
    } else {
      onRemove();
    }
  }, [isUploading, onCancel, onRemove]);

  const createVideoAsset = useCallback((videoData: UploadedVideoType) => {
    const fileName =
      videoData.file instanceof File ? videoData.file.name : FALLBACK_VIDEO_FILE_NAME;

    let videoSrc = '';
    if (videoData.file && videoData.file.size > 0) {
      try {
        videoSrc = VideoURLManager.createVideoURL(videoData.file, videoData.id);
      } catch (_error) {
        // For asset-based videos, videoSrc can be empty since modal will use assetId
        videoSrc = '';
      }
    }

    return {
      assetId: videoData.assetId?.toString() || '',
      fileName,
      format: '9:16 video',
      videoSrc,
    };
  }, []);

  const allVideoAssets = useMemo(
    () =>
      allUploadedVideos
        .filter((v) => v.assetId && (v.file || v.assetId) && v.state === VideoUploadState.FINISHED)
        .map(createVideoAsset),
    [allUploadedVideos, createVideoAsset],
  );

  const handleThumbnailClick = useCallback(() => {
    if (isFinished && video.assetId) {
      const currentAsset = createVideoAsset(video);
      openVideoPlayerDialog(currentAsset, allVideoAssets);
    }
  }, [isFinished, video, createVideoAsset, allVideoAssets]);

  const videoSrc = useMemo(() => {
    if (!video.file) {
      return '';
    }
    return VideoURLManager.createVideoURL(video.file, video.id);
  }, [video.file, video.id]);

  const renderThumbnail = useCallback(() => {
    const shouldShowVideoPlayer = isFinished && video.assetId;
    const clickHandler = shouldShowVideoPlayer ? handleThumbnailClick : undefined;

    // For videos with asset IDs, use RobloxVideoPlayer
    if (video.assetId && isFinished) {
      const videoElement = (
        <RobloxVideoPlayer
          className={videoThumbnail}
          disableControls
          environment={GetVideoPlayerEnvEnum()}
          muted
          videoAssetId={video.assetId.toString()}
        />
      );

      if (clickHandler && !disabled) {
        return (
          <div
            aria-label={translate('Action.PlayVideo')}
            className={thumbnailContainerClickable}
            onClick={clickHandler}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler();
              }
            }}
            role='button'
            tabIndex={0}>
            {videoElement}
          </div>
        );
      }

      return <div className={thumbnailContainer}>{videoElement}</div>;
    }

    // For videos with files but no asset ID (newly uploaded)
    if (video.file && video.file.size > 0) {
      const videoElement = (
        <video className={videoThumbnail} muted preload='metadata' src={videoSrc}>
          {translate('Description.BrowserNoVideoSupport')}
        </video>
      );

      if (clickHandler && !disabled) {
        return (
          <div
            aria-label={translate('Action.PlayVideo')}
            className={thumbnailContainerClickable}
            onClick={clickHandler}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clickHandler();
              }
            }}
            role='button'
            tabIndex={0}>
            {videoElement}
          </div>
        );
      }

      return <div className={thumbnailContainer}>{videoElement}</div>;
    }

    // Fallback for videos without file or asset ID
    return (
      <div className={placeholder}>
        <span className='text-body-medium content-default'>{translate('Label.Video')}</span>
      </div>
    );
  }, [
    isFinished,
    video.assetId,
    video.file,
    videoSrc,
    disabled,
    handleThumbnailClick,
    placeholder,
    thumbnailContainer,
    thumbnailContainerClickable,
    videoThumbnail,
    translate,
  ]);

  const renderStatusIcon = useCallback(() => {
    if (!statusDetails?.icon) {
      return null;
    }

    return statusDetails.icon;
  }, [statusDetails]);

  const renderRightSideContent = useCallback(
    () => (
      <Grid alignItems='center' container direction='row' spacing={1}>
        {isFinished && renderStatusIcon() && (
          <Grid item>
            <div className={statusIconContainer}>{renderStatusIcon()}</div>
          </Grid>
        )}

        {isError && onRetry && (
          <Grid item>
            <IconButton
              ariaLabel={translateMisc('Action.Retry')}
              className={actionButton}
              icon='icon-regular-arrow-spin-clockwise'
              onClick={onRetry}
              size='Medium'
              variant='Utility'
            />
          </Grid>
        )}

        <Grid item>
          <IconButton
            ariaLabel={translate('Description.DeleteIcon')}
            className={actionButton}
            icon='icon-regular-trash-can'
            isDisabled={isUploading && !onCancel}
            onClick={handleAction}
            size='Medium'
            variant='Utility'
          />
        </Grid>
      </Grid>
    ),
    [
      isUploading,
      isFinished,
      isError,
      onCancel,
      onRetry,
      handleAction,
      actionButton,
      statusIconContainer,
      renderStatusIcon,
      translate,
      translateMisc,
    ],
  );

  const fileName = video.file instanceof File ? video.file.name : FALLBACK_VIDEO_FILE_NAME;

  return (
    <Grid alignItems='center' className={cardContainer} container spacing={2}>
      <Grid item>{renderThumbnail()}</Grid>
      <Grid className={contentContainer} item>
        <Grid container direction='column' spacing={0.5}>
          <Grid item>
            <span className={`text-body-medium ${fileNameClass}`}>{fileName}</span>
          </Grid>
          {statusDetails && (
            <Grid item>
              <Grid alignItems='center' container spacing={0.5} wrap='nowrap'>
                {statusDetails.icon && isUploading && (
                  <Grid className={statusIconGrid} item>
                    {renderStatusIcon()}
                  </Grid>
                )}
                <Grid className={statusTextContainer} item>
                  <span
                    className={`text-body-medium ${STATUS_COLOR_CLASS[statusDetails.color]} ${statusText}`}>
                    {statusDetails.text}
                  </span>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid item>{renderRightSideContent()}</Grid>
    </Grid>
  );
};

export default VideoUploadCard;
