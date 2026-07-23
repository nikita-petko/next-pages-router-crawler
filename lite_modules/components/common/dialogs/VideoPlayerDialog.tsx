import { Button, DialogBody, DialogFooter, DialogTitle, IconButton } from '@rbx/foundation-ui';
import { UIThemeProvider } from '@rbx/ui';
import { RobloxVideoPlayer, VideoPlayer, type VideoPlayerRef } from '@rbx/video-player';
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import useVideoPlayerDialogStyles, {
  type VideoAsset,
} from '@components/common/dialogs/VideoPlayerDialog.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { GetVideoPlayerEnvEnum } from '@utils/url';

interface VideoPlayerDialogProps extends BaseInjectedDialogProps {
  allAssets: VideoAsset[];
  initialAsset: VideoAsset;
}

const VideoPlayerDialog = ({
  allAssets,
  initialAsset,
  onClose,
}: VideoPlayerDialogProps): ReactElement => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: {
      footer,
      header,
      leftNav,
      modalContent,
      navButton,
      rightNav,
      video,
      videoContainer,
      videoLoading,
      videoWrapper,
    },
  } = useVideoPlayerDialogStyles();

  const initialIndex = Math.max(
    0,
    allAssets.findIndex((asset) => asset.assetId === initialAsset.assetId),
  );
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [currentAsset, setCurrentAsset] = useState<VideoAsset>(
    allAssets[initialIndex] ?? initialAsset,
  );
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);
  const [videoKey, setVideoKey] = useState<number>(0);
  const videoRef = useRef<VideoPlayerRef>(null);
  const preloadedVideos = useRef<Set<string>>(new Set());

  const showNavigation = allAssets.length > 1;

  const preloadVideo = useCallback((videoSrc: string): void => {
    if (preloadedVideos.current.has(videoSrc)) {
      return;
    }
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.src = videoSrc;
    preloadedVideos.current.add(videoSrc);
  }, []);

  const selectAssetAtIndex = useCallback(
    (index: number): void => {
      const asset = allAssets[index];
      if (!asset) {
        return;
      }
      setCurrentIndex(index);
      setCurrentAsset(asset);
      setIsVideoLoading(true);
      setVideoKey((prev) => prev + 1);
    },
    [allAssets],
  );

  const navigateToNext = useCallback((): void => {
    if (allAssets.length <= 1) {
      return;
    }
    const nextIndex = (currentIndex + 1) % allAssets.length;
    selectAssetAtIndex(nextIndex);
  }, [allAssets.length, currentIndex, selectAssetAtIndex]);

  const navigateToPrevious = useCallback((): void => {
    if (allAssets.length <= 1) {
      return;
    }
    const prevIndex = currentIndex === 0 ? allAssets.length - 1 : currentIndex - 1;
    selectAssetAtIndex(prevIndex);
  }, [allAssets.length, currentIndex, selectAssetAtIndex]);

  useEffect(() => {
    if (allAssets.length <= 1) {
      return;
    }
    const nextIndex = (currentIndex + 1) % allAssets.length;
    const prevIndex = currentIndex === 0 ? allAssets.length - 1 : currentIndex - 1;
    if (allAssets[nextIndex]) {
      preloadVideo(allAssets[nextIndex].videoSrc);
    }
    if (allAssets[prevIndex]) {
      preloadVideo(allAssets[prevIndex].videoSrc);
    }
  }, [allAssets, currentIndex, preloadVideo]);

  useEffect(
    () => () => {
      preloadedVideos.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (!showNavigation) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowLeft') {
        navigateToPrevious();
      } else if (event.key === 'ArrowRight') {
        navigateToNext();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigateToNext, navigateToPrevious, showNavigation]);

  const handleLoadStart = (): void => setIsVideoLoading(true);
  const handleLoadedData = (): void => setIsVideoLoading(false);
  const handleError = (): void => setIsVideoLoading(false);

  return (
    <UIThemeProvider>
      <DialogBody className='padding-none'>
        <div className={header}>
          <DialogTitle className='text-heading-medium margin-none'>
            {translateReport('Heading.AssetPreview')}
          </DialogTitle>
        </div>
        <div className={modalContent}>
          <div className={leftNav}>
            {showNavigation ? (
              <IconButton
                ariaLabel={translateReport('Description.PreviousVideo')}
                className={navButton}
                icon='icon-regular-chevron-large-left'
                onClick={navigateToPrevious}
                size='Small'
                variant='Utility'
              />
            ) : null}
          </div>
          <div className={videoContainer}>
            <div className={videoWrapper}>
              {isVideoLoading ? (
                <div className={videoLoading}>
                  <span className='text-body-medium content-default'>
                    {translateReport('Description.LoadingVideo')}
                  </span>
                </div>
              ) : null}
              {currentAsset.assetId ? (
                <RobloxVideoPlayer
                  autoPlay
                  className={video}
                  environment={GetVideoPlayerEnvEnum()}
                  key={videoKey}
                  loop
                  muted
                  onError={handleError}
                  onLoadedData={handleLoadedData}
                  onLoadStart={handleLoadStart}
                  videoAssetId={currentAsset.assetId}
                />
              ) : (
                <VideoPlayer
                  autoPlay
                  className={video}
                  key={videoKey}
                  loop
                  muted
                  onError={handleError}
                  onLoadedData={handleLoadedData}
                  onLoadStart={handleLoadStart}
                  ref={videoRef}
                  src={currentAsset.videoSrc || ''}
                />
              )}
            </div>
          </div>
          <div className={rightNav}>
            {showNavigation ? (
              <IconButton
                ariaLabel={translateReport('Description.NextVideo')}
                className={navButton}
                icon='icon-regular-chevron-large-right'
                onClick={navigateToNext}
                size='Small'
                variant='Utility'
              />
            ) : null}
          </div>
        </div>
      </DialogBody>
      <DialogFooter className={footer}>
        <Button onClick={onClose} size='Medium' variant='Emphasis'>
          {translateMisc('Action.Close')}
        </Button>
      </DialogFooter>
    </UIThemeProvider>
  );
};

export const openVideoPlayerDialog = (initialAsset: VideoAsset, allAssets?: VideoAsset[]): void => {
  const assets = allAssets ?? [initialAsset];
  openDialog({
    component: VideoPlayerDialog,
    options: { hasCloseAffordance: true },
    props: { allAssets: assets, initialAsset },
  });
};

export default VideoPlayerDialog;
