import React from 'react';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import useThumbnailIconStyles from './thumbnailIcon.styles';

type StoreAssetIconProps = {
  /** Creator Store asset id whose thumbnail should be rendered. */
  assetId: number;
  name?: string;
};

/**
 * Renders a Creator Store asset's thumbnail (via the thumbnails service) for a
 * search result row, mirroring how ExperienceIcon renders experience icons.
 * Falls back to the thumbnails service placeholder while loading or when the
 * asset has no available thumbnail.
 */
const StoreAssetIcon: React.FC<StoreAssetIconProps> = ({ assetId, name = '' }) => {
  const { classes } = useThumbnailIconStyles();
  return (
    <div className={classes.container}>
      <Thumbnail2d
        alt={name}
        targetId={assetId}
        containerClass={classes.image}
        type={ThumbnailTypes.assetThumbnail}
        returnPolicy={ReturnPolicy.PlaceHolder}
      />
    </div>
  );
};

export default StoreAssetIcon;
