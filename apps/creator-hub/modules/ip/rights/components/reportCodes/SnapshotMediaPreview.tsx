import React, {
  type CSSProperties,
  type FunctionComponent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Grid, Skeleton, useTheme } from '@rbx/ui';
import { RobloxVideoPlayer } from '@rbx/video-player';
import { Asset } from '@modules/miscellaneous/common';

export type SnapshotMediaVariant = 'full' | 'mini';

const VARIANT_CONFIG = {
  full: {
    autoPlay: false,
    disableControls: false,
    loop: false,
    objectFit: 'contain' as const,
  },
  mini: {
    autoPlay: true,
    disableControls: true,
    loop: true,
    objectFit: 'cover' as const,
  },
} satisfies Record<SnapshotMediaVariant, unknown>;

const getVideoContainerSx = (objectFit: 'contain' | 'cover') =>
  ({
    position: 'relative',
    overflow: 'hidden',
    '& > div': { width: '100%', height: '100%' },
    '& video': { width: '100%', height: '100%', objectFit },
  }) as const;

const miniSx = {
  width: 40,
  height: 40,
  overflow: 'hidden',
  borderRadius: '4px',
};

const fillImageStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  borderRadius: 'inherit',
};

const skeletonStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 'inherit',
};

function getAltText(assetType?: string, contentId?: string): string {
  if (assetType && contentId) {
    return `${assetType} (${contentId})`;
  }
  return contentId ?? '';
}

export interface SnapshotMediaPreviewProps {
  contentUri?: string;
  assetType?: string;
  contentId?: string;
  /** Controls sizing, playback behaviour, and image fit. Defaults to 'full'. */
  variant?: SnapshotMediaVariant;
  style?: CSSProperties;
  /** Used only when no preview URI/default preview exists, not for broken image loads. */
  fallback?: React.ReactNode;
}

enum BrowserImageLoadState {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

const SnapshotMediaPreview: FunctionComponent<SnapshotMediaPreviewProps> = ({
  contentUri,
  assetType,
  contentId,
  variant = 'full',
  style,
  fallback = null,
}) => {
  const theme = useTheme();
  const config = VARIANT_CONFIG[variant];
  const isVideo = assetType === Asset.Video;
  const [browserImageLoadState, setBrowserImageLoadState] = useState<{
    contentUri?: string;
    status: BrowserImageLoadState;
  }>({ status: BrowserImageLoadState.Loading });

  const fullSx = {
    backgroundColor: theme.palette.surface[400],
    borderRadius: 0,
    width: '100%',
    aspectRatio: '1 / 1',
    position: 'relative',
    overflow: 'hidden',
    transition: theme.transitions.create('background-color', {
      duration: theme.transitions.duration.short,
    }),
  };

  const variantSx = variant === 'mini' ? miniSx : fullSx;
  const alt = getAltText(assetType, contentId);
  const currentBrowserImageLoadState =
    browserImageLoadState.contentUri === contentUri
      ? browserImageLoadState.status
      : BrowserImageLoadState.Loading;
  const showPlaceholder = currentBrowserImageLoadState === BrowserImageLoadState.Loading;
  const imageContainerStyle = useMemo<CSSProperties | undefined>(() => {
    if (isVideo || !contentUri) {
      return undefined;
    }

    if (variant === 'mini') {
      return {
        ...miniSx,
        position: 'relative',
        backgroundColor: theme.palette.surface[400],
        ...style,
      };
    }

    return {
      backgroundColor: theme.palette.surface[400],
      borderRadius: 0,
      width: '100%',
      aspectRatio: '1 / 1',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    };
  }, [contentUri, isVideo, style, theme.palette.surface, variant]);
  const imgStyle = useMemo<CSSProperties | undefined>(() => {
    if (isVideo || !contentUri) {
      return undefined;
    }

    return {
      ...fillImageStyle,
      objectFit: config.objectFit,
      opacity: showPlaceholder ? 0 : 1,
      transition: theme.transitions.create('opacity', {
        duration: theme.transitions.duration.short,
      }),
    };
  }, [config.objectFit, contentUri, isVideo, showPlaceholder, theme.transitions]);

  // Track native browser <img> load/error events for the current src.
  const handleBrowserImageLoad = useCallback(() => {
    setBrowserImageLoadState({ contentUri, status: BrowserImageLoadState.Loaded });
  }, [contentUri]);
  const handleBrowserImageError = useCallback(() => {
    setBrowserImageLoadState({ contentUri, status: BrowserImageLoadState.Error });
  }, [contentUri]);

  if (isVideo && !!contentUri) {
    return (
      <Grid sx={[getVideoContainerSx(config.objectFit), variantSx]} style={style}>
        <RobloxVideoPlayer
          videoAssetId={contentId || ''}
          environment={process.env.targetEnvironment === 'production' ? 'production' : 'sitetest1'}
          src={contentUri}
          manifestUrl={contentUri}
          disableControls={config.disableControls}
          autoPlay={config.autoPlay}
          muted
          loop={config.loop}
          data-video='true'
        />
      </Grid>
    );
  }

  if (!isVideo && !!contentUri) {
    return (
      <Grid style={imageContainerStyle}>
        {showPlaceholder && (
          <Skeleton
            data-testid='snapshot-media-placeholder'
            variant='rectangular'
            width='100%'
            height='100%'
            animate={false}
            style={skeletonStyle}
          />
        )}
        <img
          src={contentUri}
          alt={alt}
          style={imgStyle}
          onLoad={handleBrowserImageLoad}
          onError={handleBrowserImageError}
        />
      </Grid>
    );
  }

  return <>{fallback}</>;
};

export default SnapshotMediaPreview;
