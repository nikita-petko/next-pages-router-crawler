import React, { useState } from 'react';
import { TTheme, makeStyles, Skeleton } from '@rbx/ui';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';

export const useThumbnailStyles = makeStyles()((theme: TTheme) => ({
  container: {
    paddingTop: `${(150 / 150) * 100}%`,
    position: 'relative',
    height: 'auto',
    width: '100%',
    overflow: 'hidden',
  },
  background: {
    backgroundColor: theme.palette.actionV2.secondary.fill,
  },
  img: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  completed: {
    transition: 'opacity .5s ease',
    opacity: 1,
  },
  loading: {
    opacity: 0,
  },
  error: {
    opacity: 0,
  },
}));

interface ThumbnailImageProps {
  imageAssetId?: number | null;
  imageUrl?: string;
  alt?: string;
  thumbnailType?: ThumbnailTypes;
}

export const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  imageAssetId,
  imageUrl,
  alt = '',
  thumbnailType = ThumbnailTypes.assetThumbnail,
}) => {
  const { classes, cx } = useThumbnailStyles();
  const [isImgReady, setIsImgReady] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const handleImageLoad = () => {
    setIsImgReady(true);
  };

  const handleImageError = () => {
    setHasError(true);
  };

  const getImageClassName = () => {
    if (hasError) {
      return classes.error;
    }
    if (isImgReady) {
      return classes.completed;
    }
    return classes.loading;
  };

  const renderThumbnail = () => {
    if (imageAssetId !== undefined && imageAssetId !== null && imageAssetId !== 0) {
      return (
        <Thumbnail2d
          skeletonVariant='rectangular'
          type={thumbnailType}
          targetId={Number(imageAssetId)}
          alt={alt}
          includeBackground
          containerClass={classes.img}
        />
      );
    }

    if (imageUrl) {
      return (
        <img
          className={cx(classes.img, getImageClassName())}
          src={imageUrl}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      );
    }

    return <Skeleton className={classes.img} variant='rectangular' animate={false} />;
  };

  return <span className={cx(classes.container, classes.background)}>{renderThumbnail()}</span>;
};

export default ThumbnailImage;
