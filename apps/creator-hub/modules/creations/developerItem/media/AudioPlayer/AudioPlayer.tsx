import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconButton, ProgressCircle, Slider } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import legacyAssetConstants from '@modules/miscellaneous/components/EmptyState/legacyAssetConstants';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';
import useAudioPlaybackUrl from '../hooks/useAudioPlaybackUrl';

const DEFAULT_SLIDER_MAX = 100;

const audioPlayerClasses = {
  timeLabel: 'text-body-small content-muted text-no-wrap shrink-0',
  sliderWrapper: '[flex:1] [padding-left:var(--size-100)]',
  errorMessage:
    'text-body-small content-muted text-align-x-center [margin-top:var(--size-200)] margin-bottom-none',
  compactWrapper: 'flex flex-col gap-xsmall',
  compactTitle: 'text-title-medium content-emphasis margin-none',
  compactCreator: 'text-body-medium content-muted margin-none',
  compactControlsRow: 'flex items-center gap-xsmall width-full [margin-top:var(--size-200)]',
  compactThumbnailWrapper:
    'shrink-0 radius-medium [width:80px] [height:80px] [overflow:hidden] flex items-center justify-center bg-surface-200',
  compactThumbnail: '[width:80px] [height:80px] [object-fit:cover]',
  compactErrorMessage: 'text-body-small content-muted margin-none',
  card: 'radius-medium [overflow:hidden]',
  cardThumbnail: 'width-full aspect-1-1 [object-fit:cover] block',
  cardInfo:
    'flex flex-col items-center gap-xsmall padding-large [box-sizing:border-box] width-full',
  cardTitle: 'text-title-medium content-emphasis text-align-x-center margin-none',
  cardCreator: 'text-body-medium content-muted text-align-x-center margin-none',
  timelineRow: 'flex items-center gap-small width-full [margin-top:var(--size-200)]',
  playButtonWrapper: 'flex justify-center [margin-top:var(--size-200)]',
} as const;

function formatTime(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) {
    return '0:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

type AudioPlayerProps = {
  assetId: number;
  compact?: boolean;
  creatorName: string | undefined;
  name: string;
  thumbnailTargetId: number | null;
};

const AudioPlayer: FunctionComponent<AudioPlayerProps> = ({
  assetId,
  compact = false,
  creatorName,
  name,
  thumbnailTargetId,
}) => {
  const { translate } = useTranslation();
  const { url, isLoading, error } = useAudioPlaybackUrl(assetId);
  const { thumbnailData } = useThumbnailImage({
    targetId: compact ? (thumbnailTargetId ?? 0) : (thumbnailTargetId ?? assetId),
    targetType: ThumbnailTypes.assetThumbnail,
    returnPolicy: ReturnPolicy.PlaceHolder,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (isPlaying) {
      audio.pause();
    } else {
      // play() can be rejected by the browser (e.g. autoplay policy); UI state
      // stays consistent because the audio element fires no play event on failure.
      audio.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleSeek = useCallback((values: number[]) => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const t = values[0];
    if (t === undefined) {
      return;
    }
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return undefined;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      audio.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [url]);

  const thumbnailUrl = thumbnailData?.imageUrl;

  const playButton = isLoading ? (
    <ProgressCircle
      variant='Indeterminate'
      size='Small'
      ariaLabel={translate('Label.LoadingAudio')}
    />
  ) : (
    <IconButton
      variant='Emphasis'
      size='Large'
      isCircular
      icon={isPlaying ? 'icon-filled-pause-large' : 'icon-filled-play-large'}
      ariaLabel={isPlaying ? translate('Action.PauseAudio') : translate('Action.PlayAudio')}
      onClick={togglePlay}
    />
  );

  const timeline = error ? null : (
    <>
      <span className={audioPlayerClasses.timeLabel}>{formatTime(currentTime)}</span>
      <div className={audioPlayerClasses.sliderWrapper}>
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || DEFAULT_SLIDER_MAX}
          onValueChange={handleSeek}
          thumbAriaNames={[translate('Label.AudioProgress')]}
        />
      </div>
      <span className={audioPlayerClasses.timeLabel}>{formatTime(duration)}</span>
    </>
  );

  const errorMessage = error ? (
    <p className={audioPlayerClasses.errorMessage}>
      {translate('Message.AudioPreviewUnavailable')}
    </p>
  ) : null;

  const audioElement = !error ? (
    // oxlint-disable-next-line jsx-a11y/media-has-caption -- audio-only player; captions are not applicable for music and sound effect previews
    <audio
      ref={audioRef}
      src={url ?? undefined}
      preload='metadata'
      aria-label={translate('Label.AudioPreview')}
    />
  ) : null;

  if (compact) {
    return (
      <>
        {audioElement}
        <div className={audioPlayerClasses.compactWrapper}>
          <p className={audioPlayerClasses.compactTitle}>{name}</p>
          {creatorName && <p className={audioPlayerClasses.compactCreator}>@{creatorName}</p>}
          <div className={audioPlayerClasses.compactControlsRow}>
            <div className={audioPlayerClasses.compactThumbnailWrapper}>
              <img
                className={audioPlayerClasses.compactThumbnail}
                src={thumbnailUrl ?? legacyAssetConstants.small.audio}
                alt={name}
              />
            </div>
            {error ? (
              <p className={audioPlayerClasses.compactErrorMessage}>
                {translate('Message.AudioPreviewUnavailable')}
              </p>
            ) : (
              <>
                {playButton}
                {timeline}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {audioElement}
      <div className={audioPlayerClasses.card}>
        <img
          className={audioPlayerClasses.cardThumbnail}
          src={thumbnailUrl ?? legacyAssetConstants.small.audio}
          alt={name}
        />
        <div className={audioPlayerClasses.cardInfo}>
          <p className={audioPlayerClasses.cardTitle}>{name}</p>
          {creatorName && <p className={audioPlayerClasses.cardCreator}>{creatorName}</p>}
          {errorMessage ?? (
            <>
              <div className={audioPlayerClasses.timelineRow}>{timeline}</div>
              <div className={audioPlayerClasses.playButtonWrapper}>{playButton}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AudioPlayer;
