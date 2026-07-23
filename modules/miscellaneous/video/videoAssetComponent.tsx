import { RobloxVideoPlayer, VideoPlayerRef } from '@rbx/video-player';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

import { ServerAdAssetCompositeReviewDecisionType } from '@type/ad';
import { GetVideoPlayerEnvEnum } from '@utils/url';

interface PropsType {
  compositeReviewDecision?: ServerAdAssetCompositeReviewDecisionType;
  setUseThumbnailForVideo: Dispatch<SetStateAction<boolean>>;
  videoAssetId?: string;
}

const VideoAssetComponent = ({
  compositeReviewDecision = ServerAdAssetCompositeReviewDecisionType.PENDING_REVIEW,
  setUseThumbnailForVideo,
  videoAssetId,
}: PropsType) => {
  const [currentVideoElementRef, setCurrentVideoElementRef] = useState<HTMLVideoElement | null>(
    null,
  );

  const videoElementRef = useCallback((node: VideoPlayerRef | null) => {
    if (node !== null) {
      setCurrentVideoElementRef(node);
    }
  }, []);

  useEffect(() => {
    if (currentVideoElementRef && videoAssetId) {
      if (compositeReviewDecision !== ServerAdAssetCompositeReviewDecisionType.APPROVED) {
        setUseThumbnailForVideo(true);
      }
    }
  }, [currentVideoElementRef]);

  const env = GetVideoPlayerEnvEnum();
  const handleLoadError = useCallback(() => {
    setUseThumbnailForVideo(true);
  }, []);

  return (
    <RobloxVideoPlayer
      autoPlay
      disableControls
      environment={env}
      muted
      onLoadError={handleLoadError}
      ref={videoElementRef}
      videoAssetId={videoAssetId || ''}
    />
  );
};

export default VideoAssetComponent;
