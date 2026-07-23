import { type JSX, useCallback, useMemo } from 'react';

import useCreativesStyles from '@components/campaignBuilder/common/creative/Creatives.styles';
import VideoThumbnailAndPreview from '@components/campaignBuilder/common/creative/videoSection/VideoThumbnailAndPreview';
import { openVideoPlayerDialog } from '@components/common/dialogs/VideoPlayerDialog';
import { useAdCreativeAssetStore } from '@modules/stores/adCreativeStoreProvider';
import { UploadedVideoType, VideoUploadState } from '@type/fileUpload';
import { CaptureException } from '@utils/error';
import { VideoURLManager } from '@utils/fileUpload';

interface VideoSectionProps {
  maybeRenderUploadVideoButton: () => JSX.Element | null;
  maybeRenderVideoLoadingIndicator: () => JSX.Element | null;
  videos: UploadedVideoType[];
}

const VideoSection = ({
  maybeRenderUploadVideoButton,
  maybeRenderVideoLoadingIndicator,
  videos,
}: VideoSectionProps) => {
  const {
    classes: { creativeSectionPreviewContainer },
  } = useCreativesStyles();

  const { assetIdToUrl } = useAdCreativeAssetStore();

  // Memoized video URL creation to prevent memory leaks and unnecessary re-computations
  const memoKey = videos.map((v) => ({ assetId: v.assetId, hasFile: !!v.file, id: v.id }));
  const videoUrlMap = useMemo(() => {
    const urlMap = new Map<string, string>();

    videos.forEach((video) => {
      if (video.file && video.file.size > 0) {
        // For newly uploaded videos with actual file content
        try {
          const videoSrc = VideoURLManager.createVideoURL(video.file, video.id);
          urlMap.set(video.id, videoSrc);
        } catch (error) {
          CaptureException(error, {
            context: 'Failed to create video URL for video',
            videoId: video.id,
          });
        }
      } else if (video.assetId) {
        // For existing videos with asset IDs, use the asset-to-URL mapping
        const assetVideoUrl = assetIdToUrl.get(Number(video.assetId));
        if (assetVideoUrl) {
          urlMap.set(video.id, assetVideoUrl);
        }
      }
    });

    return urlMap;
  }, [memoKey, assetIdToUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const createVideoAsset = useCallback(
    (video: UploadedVideoType) => {
      if (!video.assetId && !video.file) {
        return null;
      }

      const videoSrc = videoUrlMap.get(video.id);

      // For videos with asset IDs, we don't need a videoSrc since RobloxVideoPlayer handles it internally
      // But we still need to return a valid asset for the modal
      if (video.assetId) {
        return {
          assetId: video.assetId.toString(),
          videoSrc: videoSrc || '', // Empty string is fine for asset-based videos
        };
      }

      // For file-based videos, we need a valid videoSrc
      if (!videoSrc) {
        return null;
      }

      return {
        assetId: video.assetId?.toString() || '',
        videoSrc,
      };
    },
    [videoUrlMap],
  );

  // Optimize: Use proper dependency tracking instead of string concatenation
  const allVideoAssets = useMemo(() => {
    if (!videos) {
      return [];
    }

    return videos
      .filter(
        (v: UploadedVideoType) => (v.assetId || v.file) && v.state === VideoUploadState.FINISHED,
      )
      .map(createVideoAsset)
      .filter((asset) => asset !== null);
  }, [videos, createVideoAsset]);

  const handleVideoClick = useCallback(
    (clickedVideo: UploadedVideoType) => {
      if (!clickedVideo.assetId && !clickedVideo.file) {
        return;
      }

      const currentAsset = createVideoAsset(clickedVideo);
      if (currentAsset) {
        openVideoPlayerDialog(currentAsset, allVideoAssets);
      }
    },
    [createVideoAsset, allVideoAssets],
  );

  const renderedVideos = useMemo(
    () =>
      videos.map((video) => (
        <VideoThumbnailAndPreview
          key={video.id}
          onVideoClick={handleVideoClick}
          video={video}
          videoSrc={videoUrlMap.get(video.id)}
        />
      )),
    [videos, handleVideoClick, videoUrlMap],
  );

  const loadingIndicator = maybeRenderVideoLoadingIndicator();
  const uploadButton = maybeRenderUploadVideoButton();

  return (
    <div className={creativeSectionPreviewContainer}>
      {renderedVideos}
      {loadingIndicator}
      {uploadButton}
    </div>
  );
};

export default VideoSection;
