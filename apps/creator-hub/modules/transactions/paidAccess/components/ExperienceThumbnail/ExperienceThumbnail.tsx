import { Fragment } from 'react';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';
import type { PaidAccessProduct } from '../../constants/PaidAccessProductType';

interface ExperienceThumbnailProps {
  targetProduct: PaidAccessProduct;
}

const ExperienceThumbnail = ({ targetProduct }: ExperienceThumbnailProps) => {
  const { thumbnailImage } = useThumbnailImage({
    alt: 'thumbnail',
    returnPolicy: ReturnPolicy.PlaceHolder,
    targetId: targetProduct.rootPlaceId,
    targetType: ThumbnailTypes.assetThumbnail,
  });

  return <>{thumbnailImage}</>;
};

export default ExperienceThumbnail;
