import { CloseIcon, Typography } from '@rbx/ui';
import { useRef, useState } from 'react';

import VideoPreviewControls from './videoPreviewControls';

const CPV15_BACKGROUND_IMAGE_URL = `${process.env.assetPathPrefix}/common/ads_billboard_zoomed.png`;
const DEFAULT_BACKGROUND_IMAGE_URL = `${process.env.assetPathPrefix}/common/display_ad_preview_default.jpg`;

interface VideoPreviewProps {
  closeModal: () => void;
  isCpv15: boolean;
  uploadedFormat?: string;
  uploadedVideoObjectUrl?: string;
}

const VideoPreview = ({
  closeModal,
  isCpv15,
  uploadedFormat,
  uploadedVideoObjectUrl,
}: VideoPreviewProps) => {
  const scaffolding_preview_image_url = isCpv15
    ? CPV15_BACKGROUND_IMAGE_URL
    : DEFAULT_BACKGROUND_IMAGE_URL;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(!isCpv15);

  const play = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const onPausePlayToggle = playing ? pause : play;

  const onMuteToggle = () => {
    setMuted(!muted);
  };

  const undraggable = {
    MozUserSelect: 'none',
    MsUserSelect: 'none',
    userDrag: 'none',
    userSelect: 'none',
    WebkitUserDrag: 'none',
    WebkitUserSelect: 'none',
  };

  const awareness_image_overlay_styles = {
    height: '38.1%',
    left: '30.6%',
    margin: '0.5%',
    position: 'absolute',
    top: '21.85%',
    transform: 'scaleY(0.9645)',
    width: '38.36%',
    // @ts-ignore
    zIndex: '21',
  };

  const CPV_image_overlay_styles = {
    height: '89%',
    left: '9%',
    margin: '0.5%',
    position: 'absolute',
    top: '4%',
    transform: 'scaleY(0.975)',
    width: '82.8%',
    zIndex: 21,
  };

  const uploadedFileStyles = isCpv15 ? CPV_image_overlay_styles : awareness_image_overlay_styles;
  return (
    <div
      style={{
        left: '50%',
        position: 'fixed',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
      <div
        style={{
          backgroundColor: 'rgba(0,0,0,0.9)',
          height: '38px',
          position: 'absolute',
          top: '-38px',
          width: '100%',
        }}>
        <Typography
          style={{ color: '#F5BA19', left: '8px', position: 'absolute', top: '8px' }}
          variant='body1'>
          Publisher can customize ad container style to best fit their experience.
        </Typography>
        <CloseIcon
          onClick={closeModal}
          style={{ color: 'white', position: 'absolute', right: 0, top: '8px' }}
        />
      </div>
      <div
        style={{
          aspectRatio: isCpv15 ? '2284/1196' : '1143/659',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          width: '70vw',
        }}>
        <div
          style={{
            height: '100%',
            left: '50%',
            position: 'absolute',
            top: '50%',
            transform: `translate(${isZoomedIn ? '-49.5%, -28%' : '-50%, -50%'}) scale(${
              isZoomedIn ? 2.45 : 1.01
            })`, // trim off image border
            transition: 'transform 1s ease-in-out',
            width: '100%',
          }}>
          <img
            alt='preview of ad in experience'
            draggable={false}
            src={scaffolding_preview_image_url}
            // @ts-ignore
            style={{
              width: '100%',
              zIndex: '21',
              // @ts-ignore
              ...undraggable,
            }}
          />
          <div
            // @ts-ignore
            style={{
              // @ts-ignore
              ...uploadedFileStyles,
              ...undraggable,
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'center',
              margin: 0,
            }}>
            <video
              autoPlay
              controls={false}
              loop
              muted={muted && !(isZoomedIn || isCpv15)}
              ref={videoRef}
              style={{ height: '100%', width: '100%' }}>
              <source src={uploadedVideoObjectUrl} type={uploadedFormat} />
            </video>
            <VideoPreviewControls
              canExitFullscreen={!isCpv15}
              data-testid='video-preview-controls'
              isFullscreen={isZoomedIn || isCpv15}
              muted={muted}
              onEnterFullscreen={() => setIsZoomedIn(true)}
              onExitFullscreen={() => {
                setIsZoomedIn(false);
                play();
              }}
              onMuteToggle={onMuteToggle}
              onPausePlayToggle={onPausePlayToggle}
              playing={playing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
