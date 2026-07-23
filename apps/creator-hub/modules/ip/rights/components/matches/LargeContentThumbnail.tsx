import type { SearchContent } from '@rbx/client-rights/v1';
import { SearchContentContentTypeEnum } from '@rbx/client-rights/v1';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Card } from '@rbx/ui';
import useContentTileStyles from './useContentTileStyles';

export interface LargeContentThumbnailProps {
  content: SearchContent;
  selected: boolean;
}
/**
 * LargeContentThumbnail displays a thumbnail inside a Content Tile
 */
const LargeContentThumbnail = ({ content, selected }: LargeContentThumbnailProps) => {
  const {
    classes: { image, thumbnailImage, card, selectedCard },
  } = useContentTileStyles();

  const bundleType =
    content.contentType === SearchContentContentTypeEnum.Asset
      ? ThumbnailTypes.assetThumbnail
      : ThumbnailTypes.bundleThumbnail;
  return (
    <Card classes={{ root: selected ? selectedCard : card }}>
      <Thumbnail2d
        imgClassName={image}
        alt=''
        targetId={Number(content.contentId || '') || 0}
        skeletonVariant='square'
        containerClass={thumbnailImage}
        type={bundleType}
        returnPolicy={ReturnPolicy.PlaceHolder}
      />
    </Card>
  );
};

export default LargeContentThumbnail;
