import { RobloxVideoPlayer, VideoPlayer } from '@rbx/video-player';
import { useCallback, useState } from 'react';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import { FALLBACK_VIDEO_FILE_NAME } from '@constants/fileUpload';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { creativePreviewDefaultImagePath } from '@modules/creation/components/constants/assetConstants';
import { UploadedVideoType, VideoUploadState } from '@type/fileUpload';
import { CaptureException } from '@utils/error';
import { VideoURLManager } from '@utils/fileUpload';
import { GetVideoPlayerEnvEnum } from '@utils/url';

interface VideoThumbnailAndPreviewProps {
  onVideoClick: (video: UploadedVideoType) => void;
  video: UploadedVideoType;
  videoSrc?: string;
}

const VideoThumbnailAndPreview = ({
  onVideoClick,
  video,
  videoSrc,
}: VideoThumbnailAndPreviewProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: {
      videoErrorContainer,
      videoUploadContainer,
      videoUploadContainerClickable,
      videoUploadThumbnail,
      videoUploadThumbnailPlaceholder,
    },
    cx,
  } = useCreativesStyles();
  const fileName = video.file instanceof File ? video.file.name : FALLBACK_VIDEO_FILE_NAME;

  // State to track asset delivery failures
  const [assetDeliveryError, setAssetDeliveryError] = useState<boolean>(false);

  const handleVideoClick = useCallback(() => {
    onVideoClick(video);
  }, [video, onVideoClick]);

  const handleLoadError = useCallback(() => {
    setAssetDeliveryError(true);
  }, []);

  // Handle videos in error state
  if (video.state === VideoUploadState.ERROR) {
    return (
      <div
        aria-label={`Video ${fileName} - Upload failed`}
        className={videoUploadContainer}
        key={video.id}
        role='alert'>
        <div className={videoErrorContainer}>
          {translate('Heading.UploadFailed')}
          <span className='text-body-medium content-system-alert'>
            {video.error || translate('Description.UnknownError')}
          </span>
        </div>
      </div>
    );
  }

  // If no videoSrc provided as prop, fall back to creating one (for backward compatibility)
  let finalVideoSrc = videoSrc;
  if (!finalVideoSrc && video.file) {
    try {
      finalVideoSrc = VideoURLManager.createVideoURL(video.file, video.id);
    } catch (error) {
      CaptureException(error as Error, { context: 'Failed to create video URL for video' });
      return (
        <div
          aria-label={`Video ${fileName} - Error loading preview`}
          className={videoUploadContainer}
          key={video.id}
          role='alert'>
          <div className={videoErrorContainer}>
            {translate('Heading.VideoError')}
            <span className='text-body-medium content-system-alert'>
              {translate('Description.FailedToLoadPreview')}
            </span>
          </div>
        </div>
      );
    }
  }

  const canClick =
    Boolean(video.assetId && video.state === VideoUploadState.FINISHED) && !assetDeliveryError;
  const videoLabel = `Video: ${fileName}${canClick ? ' - Click to preview' : ''}`;

  // Render with VideoUploadCard structure - using appropriate VideoPlayer
  let videoElement;

  if (video.assetId && assetDeliveryError) {
    // Show fallback thumbnail if asset delivery failed
    videoElement = (
      <img
        alt={translate('Description.VideoPreviewUnavailable')}
        className={cx(videoUploadThumbnail, videoUploadThumbnailPlaceholder)}
        src={creativePreviewDefaultImagePath}
        title={translate('Description.VideoPreviewUnavailable')}
      />
    );
  } else if (video.assetId) {
    // Use RobloxVideoPlayer for asset-based videos
    videoElement = (
      <RobloxVideoPlayer
        className={videoUploadThumbnail}
        disableControls
        environment={GetVideoPlayerEnvEnum()}
        muted
        onLoadError={handleLoadError}
        videoAssetId={video.assetId.toString()}
      />
    );
  } else {
    // Use VideoPlayer for file-based videos
    videoElement = (
      <VideoPlayer
        className={videoUploadThumbnail}
        disableControls
        muted
        preload='metadata'
        src={finalVideoSrc}
      />
    );
  }

  if (canClick) {
    return (
      <div
        aria-label={videoLabel}
        className={videoUploadContainerClickable}
        onClick={handleVideoClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleVideoClick();
          }
        }}
        role='button'
        tabIndex={0}>
        {videoElement}
      </div>
    );
  }

  return <div className={videoUploadContainer}>{videoElement}</div>;
};

export default VideoThumbnailAndPreview;
