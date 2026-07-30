import type { FunctionComponent } from 'react';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '../../localization';
import type { ThumbnailImageProps } from './types';
import useThumbnailImage from './useThumbnailImage';

const ThumbnailImage: FunctionComponent<React.PropsWithChildren<ThumbnailImageProps>> = (props) => {
  const { thumbnailImage } = useThumbnailImage(props);
  return thumbnailImage;
};

export default withTranslation(ThumbnailImage, [TranslationNamespace.ConfigureItem]);
