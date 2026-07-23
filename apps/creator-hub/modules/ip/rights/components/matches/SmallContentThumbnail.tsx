import type { SearchContent } from '@rbx/client-rights/v1';
import { SearchContentContentTypeEnum } from '@rbx/client-rights/v1';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Card, makeStyles } from '@rbx/ui';

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
