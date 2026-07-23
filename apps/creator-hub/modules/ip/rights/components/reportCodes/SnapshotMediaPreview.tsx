import React, { type CSSProperties, type FunctionComponent } from 'react';
import { Grid, useTheme } from '@rbx/ui';
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

const miniImgStyle: CSSProperties = {
  width: 40,
  height: 40,
  overflow: 'hidden',
  borderRadius: 4,
};

function getAltText(assetType?: string, contentId?: string): string {
  if (assetType && contentId) return `${assetType} (${contentId})`;
  return contentId ?? '';
}

export interface SnapshotMediaPreviewProps {
  contentUri?: string;
  assetType?: string;
  contentId?: string;
  /** Controls sizing, playback behaviour, and image fit. Defaults to 'full'. */
  variant?: SnapshotMediaVariant;
  style?: CSSProperties;
  /** Rendered when assetType is neither Image nor Video. */
  fallback?: React.ReactNode;
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
  const isImage = assetType === Asset.Image;

  const fullSx = {
    backgroundColor: theme.palette.surface[400],
    borderRadius: 0,
    width: '100%',
    aspectRatio: '1 / 1',
    transition: theme.transitions.create('background-color', {
      duration: theme.transitions.duration.short,
    }),
  };

  const variantSx = variant === 'mini' ? miniSx : fullSx;
  const alt = getAltText(assetType, contentId);

  if (isVideo) {
    return (
      <Grid sx={[getVideoContainerSx(config.objectFit), variantSx]} style={style}>
        <RobloxVideoPlayer
          videoAssetId={contentUri ? '' : contentId || ''}
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

  if (isImage) {
    const imgStyle: CSSProperties =
      variant === 'mini'
        ? { ...miniImgStyle, objectFit: config.objectFit, ...style }
        : {
            backgroundColor: theme.palette.surface[400],
            borderRadius: 0,
            width: '100%',
            aspectRatio: '1 / 1',
            objectFit: config.objectFit,
            ...style,
          };
    return <img src={contentUri} alt={alt} style={imgStyle} />;
  }

  return <React.Fragment>{fallback}</React.Fragment>;
};

export default SnapshotMediaPreview;
