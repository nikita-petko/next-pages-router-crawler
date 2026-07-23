import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Card, makeStyles } from '@rbx/ui';
import React from 'react';
import { SearchContent, SearchContentContentTypeEnum } from '@rbx/clients/rightsV1';

const useThumbnailStyles = makeStyles()(() => ({
  card: {
    width: '50px',
  },
  thumbnail: {
    position: 'relative',
  },
  thumbnailImage: {
    display: 'block',
  },
}));
export interface SmallContentThumbnailProps {
  content: SearchContent;
}
const SmallContentThumbnail = ({ content }: SmallContentThumbnailProps) => {
  const {
    classes: { thumbnailImage, thumbnail, card },
  } = useThumbnailStyles();

  const bundleType =
    content.contentType === SearchContentContentTypeEnum.Asset
      ? ThumbnailTypes.assetThumbnail
      : ThumbnailTypes.bundleThumbnail;
  return (
    <Card classes={{ root: card }}>
      <div className={thumbnail}>
        <Thumbnail2d
          alt=''
          targetId={Number(content.contentId || '') || 0}
          skeletonVariant='square'
          containerClass={thumbnailImage}
          type={bundleType}
          returnPolicy={ReturnPolicy.PlaceHolder}
        />
      </div>
    </Card>
  );
};

export default SmallContentThumbnail;
