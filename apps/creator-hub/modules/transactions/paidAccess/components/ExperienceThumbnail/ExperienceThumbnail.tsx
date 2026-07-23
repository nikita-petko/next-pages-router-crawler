import { Fragment } from 'react';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import useThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/useThumbnailImage';
import { PaidAccessProduct } from '../../constants/PaidAccessProductType';

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

  return <Fragment>{thumbnailImage}</Fragment>;
};

export default ExperienceThumbnail;
