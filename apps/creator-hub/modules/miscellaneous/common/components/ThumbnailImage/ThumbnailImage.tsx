import { FunctionComponent, ReactNode } from 'react';
import { ReturnPolicy, ThumbnailTypes } from '@rbx/thumbnails';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useThumbnailImage from './useThumbnailImage';

export interface ThumbnailImageProps {
  targetId: number;
  targetType: ThumbnailTypes;
  returnPolicy?: ReturnPolicy;
  isStatusTextShown?: boolean;
  alt?: string;
  imageUrl?: string;
  fontColor?: 'dark' | 'light';
  bottomRightAdornment?: ReactNode;
}

const ThumbnailImage: FunctionComponent<React.PropsWithChildren<ThumbnailImageProps>> = (props) => {
  const { thumbnailImage } = useThumbnailImage(props);
  return thumbnailImage;
};

export default withTranslation(ThumbnailImage, [TranslationNamespace.ConfigureItem]);
