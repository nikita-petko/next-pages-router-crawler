import { makeStyles } from '@rbx/ui';
import { useEffect, useState } from 'react';

const CONTROLS_FADE_DELAY_MS = 1000;
const CONTROLS_FADE_TRANSITION_MS = 1000;

const EXPAND_VIDEO_ICON_URL = `${process.env.assetPathPrefix}/common/expand.png`;
const MUTE_ICON_URL = `${process.env.assetPathPrefix}/common/mute.png`;
const UNMUTE_ICON_URL = `${process.env.assetPathPrefix}/common/volume_up.webp`;
const AD_LABEL_ICON_URL = `${process.env.assetPathPrefix}/common/ad_label.png`;
const PAUSE_ICON_URL = `${process.env.assetPathPrefix}/common/pause.webp`;
const PLAY_ICON_URL = `${process.env.assetPathPrefix}/common/play.webp`;
const CLOSE_ICON_URL = `${process.env.assetPathPrefix}/common/close.webp`;

interface VideoPreviewControlsProps {
  canExitFullscreen: boolean;
  isFullscreen: boolean;
  muted: boolean;
  onEnterFullscreen?: () => void;
  onExitFullscreen?: () => void;
  onMuteToggle?: () => void;
  onPausePlayToggle: () => void;
  playing: boolean;
}

const VideoPreviewControls = ({
  canExitFullscreen,
  isFullscreen,
  muted,
  onEnterFullscreen,
  onExitFullscreen,
  onMuteToggle,
  onPausePlayToggle,
  playing,
}: VideoPreviewControlsProps) => {
  const [recentInteraction, setRecentInteraction] = useState(false);
  const [hideTimeout, setHideTimeout] = useState<number | null>(null);

  const handleMouseMove = () => {
    setRecentInteraction(true);

    if (hideTimeout) {
      window.clearTimeout(hideTimeout);
    }

    setHideTimeout(
      window.setTimeout(() => {
        setRecentInteraction(false);
      }, CONTROLS_FADE_DELAY_MS),
    );
  };

  useEffect(() => {
    return () => {
      if (hideTimeout) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, []);

  const handlePausePlayToggle = () => {
    if (!playing) {
      // if unpausing, hide controls instantly
      setRecentInteraction(false);
    }
    onPausePlayToggle();
  };

  const {
    classes: { buttonIcon, circularButton, hiddenControls, visibleControls },
  } = makeStyles()(() => ({
    buttonIcon: {
      left: '50%',
      maxWidth: '100%',
      objectFit: 'contain',
      position: 'absolute',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      zIndex: 31,
    },
    circularButton: {
      '&:hover': {
        background: 'rgba(1,1,1, .9)',
      },
      background: 'rgba(1,1,1, .8)',
      border: 'none',
      borderRadius: '50%',
      position: 'absolute',
      zIndex: 30,
    },
    hiddenControls: {
      opacity: 0,
      transition: `opacity ${CONTROLS_FADE_TRANSITION_MS / 1000}s`,
    },
    visibleControls: {
      opacity: 1,
    },
  }))();

  const showControls = isFullscreen && (recentInteraction || !playing);

  return (
    <>
      {!isFullscreen && (
        <button
          aria-label='Toggle mute'
          className={circularButton}
          data-testid='mute-toggle-button'
          onClick={onMuteToggle}
          style={{
            left: '7.5%',
            paddingTop: '12%',
            top: '75%',
            width: '12%',
          }}
          type='button'>
          {' '}
          <img
            alt='mute icon'
            className={buttonIcon}
            draggable={false}
            src={muted ? MUTE_ICON_URL : UNMUTE_ICON_URL}
            style={
              muted
                ? undefined
                : {
                    maxWidth: '50%',
                    width: '50%',
                  }
            }
          />
        </button>
      )}

      {!isFullscreen && (
        <button
          aria-label='Enter fullscreen'
          className={circularButton}
          data-testid='enter-fullscreen-button'
          onClick={() => {
            if (onEnterFullscreen) {
              onEnterFullscreen();
            }
          }}
          style={{
            paddingTop: '12%',
            right: '12.375%',
            top: '75%',
            width: '12%',
          }}
          type='button'>
          <img
            alt='fullscreen icon'
            className={buttonIcon}
            draggable={false}
            src={EXPAND_VIDEO_ICON_URL}
          />
        </button>
      )}

      <div
        style={{
          alignItems: 'center',
          bottom: '0.5%',
          // @ts-ignore
          containerType: 'size',
          display: 'flex',
          height: '10.108771929%',
          position: 'absolute',
          right: '0.5%',
          width: '11.447368421%',
          zIndex: 30,
        }}>
        <img alt='ad label' className={buttonIcon} draggable={false} src={AD_LABEL_ICON_URL} />
      </div>

      {isFullscreen && (
        <div
          className={showControls ? visibleControls : hiddenControls}
          id='video-preview-controls'
          onMouseDown={handleMouseMove}
          onMouseMove={handleMouseMove}
          onMouseUp={(e) => {
            if ((e.target as Element).matches('#video-preview-controls')) {
              handlePausePlayToggle();
            }
          }}
          role='presentation'
          style={{
            background: '#0006',
            height: '100%',
            left: '0',
            position: 'absolute',
            top: '0',
            width: '100%',
            zIndex: 25,
          }}>
          {canExitFullscreen && (
            <button
              aria-label='Exit fullscreen'
              className={circularButton}
              data-testid='exit-fullscreen-button'
              onClick={onExitFullscreen}
              style={{
                paddingTop: '6.884057971%',
                right: '0.5%',
                top: '0.5%',
                width: '6.884057971%',
              }}
              type='button'>
              <img
                alt='exit fullscreen icon'
                className={buttonIcon}
                draggable={false}
                src={CLOSE_ICON_URL}
                style={{
                  maxWidth: '50%',
                  width: '50%',
                }}
              />
            </button>
          )}
          <button
            aria-label='Pause/Play'
            data-testid='pause-play-button'
            onClick={handlePausePlayToggle}
            style={{
              background: 'transparent',
              border: 'none',
              height: `${17.847020934 * (isFullscreen ? 1 : 1.5)}%`,
              left: '50%',
              opacity: 0.8,
              padding: 0,
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${10.038949275 * (isFullscreen ? 1 : 1.5)}%`,
              zIndex: 30,
            }}
            type='button'>
            <img
              alt='pause/play icon'
              className={buttonIcon}
              draggable={false}
              src={playing ? PAUSE_ICON_URL : PLAY_ICON_URL}
            />
          </button>
        </div>
      )}
    </>
  );
};

export default VideoPreviewControls;
