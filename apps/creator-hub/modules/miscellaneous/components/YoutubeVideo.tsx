import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import youTubePlayer from 'youtube-player';
import type { Options } from 'youtube-player/dist/types';

/**
 * NOTE(@gperkins, 2025-05-27): This was previously a ts-expect-error:
 * NOTE(@zwang, 04/25/24): third party type definition is NOT up-to-date
 */
type TListener = unknown;
type TYouTubePlayer = ReturnType<typeof youTubePlayer> & {
  on: (event: string, listener: (event: CustomEvent) => void) => TListener;
  off: (listener: TListener) => void;
};

export type TYouTubePlayerRef = {
  pause: () => void;
  play: (seek?: number) => void;
  getCurrentTime: () => Promise<number>;
  getDuration: () => Promise<number>;
};

export enum EPlayerState {
  Unstarted = -1,
  Ended = 0,
  Playing = 1,
  Paused = 2,
  Buffering = 3,
  Cued = 5,
}

export type TYouTubePlayerProps = {
  videoId: string;
  options?: Omit<Options, 'videoId'>;
  className?: string;
  onPlay?: (event: CustomEvent) => void;
  onPaused?: (event: CustomEvent) => void;
  onEnd?: (event: CustomEvent) => void;
  onReady?: (event: CustomEvent) => void;
};

const YouTubePlayer = (
  { videoId, options, className, onPlay, onPaused, onEnd, onReady }: TYouTubePlayerProps,
  ref: React.Ref<TYouTubePlayerRef>,
): React.JSX.Element => {
  const didInitRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<TYouTubePlayer | null>(null);
  const shouldAutoplay = options?.playerVars?.autoplay === 1;

  // * Exposed interface when used with ref
  useImperativeHandle(ref, () => ({
    pause: () => {
      void player?.pauseVideo();
    },
    play: (seek?: number) => {
      if (seek !== undefined) {
        void player?.seekTo(seek, true);
      }
      void player?.playVideo();
    },
    getCurrentTime: async (): Promise<number> => {
      return (await player?.getCurrentTime()) ?? -1;
    },
    getDuration: async (): Promise<number> => {
      return (await player?.getDuration()) ?? -1;
    },
  }));

  // * Video handlers
  const onPlayerStateChange = useCallback(
    (event: CustomEvent & { data: EPlayerState }) => {
      switch (event.data) {
        case EPlayerState.Playing:
          if (onPlay) {
            onPlay(event);
          }
          break;
        case EPlayerState.Paused:
          if (onPaused) {
            onPaused(event);
          }
          break;
        case EPlayerState.Ended:
          if (onEnd) {
            onEnd(event);
          }
          break;
        case EPlayerState.Unstarted:
        case EPlayerState.Buffering:
        case EPlayerState.Cued:
          // No-op: these states aren't surfaced to callers.
          break;
        default:
          break;
      }
    },
    [onEnd, onPaused, onPlay],
  );

  const onReadyHandler = useCallback(
    (e: CustomEvent) => {
      if (onReady) {
        onReady(e);
      }
    },
    [onReady],
  );

  // * Only initialize player on client-side
  useEffect(() => {
    if (containerRef.current != null) {
      setPlayer(
        // The `youtube-player` package's published types omit `.on()` / `.off()`, so we extend
        // the return type to include them. Fixing this requires updated upstream types.
        // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        youTubePlayer(containerRef.current, {
          ...options,
          host: 'https://www.youtube-nocookie.com',
          playerVars: {
            cc_load_policy: 1,
            ...options?.playerVars,
          },
        }) as TYouTubePlayer,
      );
    }
  }, [options]);

  // * Make sure player instances are properly cleaned up
  useEffect(() => {
    return () => {
      void player?.destroy();
    };
  }, [player]);

  // * Video handlers attachment/update
  useEffect(() => {
    // * NOTE: (@zwang, 04/25/24): third party type definition is NOT up-to-date, `on` actually
    // * returns a `listener` object that can be used with `off`
    const stateChangeListener = player?.on('stateChange', onPlayerStateChange);
    const readyListener = player?.on('ready', onReadyHandler);

    return () => {
      player?.off(stateChangeListener);
      player?.off(readyListener);
    };
  }, [onPlayerStateChange, onReadyHandler, player]);

  // * Video loading/updating
  useEffect(() => {
    void player?.loadVideoById(videoId).finally(() => {
      /**
       * * (@zwang, 04/26/24): the underlying YouTube iframe API will be injected into `window`
       * * when first loaded and persisted though navigation since this is a SPA - this however
       * * causes an undesirable behavior where the play/pause/stop state of the player will stay
       * * if you navigate away and then click the "back" button, even if the original player has
       * * already been "destroyed"
       * *
       * * For now I'm forcing it manually reset back to "stopped"/"not started" but it can be
       * * "fixed" or become configurable. Skip the reset when the caller opted into autoplay —
       * * otherwise we'd cancel their intended playback.
       */
      if (!didInitRef.current) {
        if (!shouldAutoplay) {
          void player.stopVideo().finally(() => {
            didInitRef.current = true;
          });
        } else {
          didInitRef.current = true;
        }
      }
    });
  }, [player, videoId, shouldAutoplay]);

  return <div className={className} ref={containerRef} />;
};

export default forwardRef(YouTubePlayer);
