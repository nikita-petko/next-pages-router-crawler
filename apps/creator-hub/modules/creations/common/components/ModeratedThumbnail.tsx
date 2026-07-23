import React, { FunctionComponent } from 'react';
import { BundleModerationStatus } from '@modules/clients/itemconfiguration';
import useThumbnailStyles from './ModeratedThumbnail.styles';
import {
  brokenPlaceholderIconPath,
  notApprovedPlaceholderIconPath,
  reviewPendingPlaceholderIconPath,
  unknownPlaceholderIconPath,
} from '../constants/thumbnailConstants';

export interface ModeratedThumbnailProps {
  containerClass: string;
  bundleModerationStatus: BundleModerationStatus;
  alt: string;
}

const ModeratedThumbnail: FunctionComponent<React.PropsWithChildren<ModeratedThumbnailProps>> = ({
  containerClass,
  bundleModerationStatus,
  alt,
}) => {
  const {
    classes: { container, moderatedThumbnail },

    cx,
  } = useThumbnailStyles();
  let thumbnailUrl;

  switch (bundleModerationStatus) {
    case BundleModerationStatus.NUMBER_0:
      thumbnailUrl = brokenPlaceholderIconPath;
      break;
    case BundleModerationStatus.NUMBER_1:
      thumbnailUrl = reviewPendingPlaceholderIconPath;
      break;
    case BundleModerationStatus.NUMBER_2:
      thumbnailUrl = notApprovedPlaceholderIconPath;
      break;
    default:
      thumbnailUrl = unknownPlaceholderIconPath;
  }

  return (
    <span className={cx(container, containerClass)}>
      <img className={moderatedThumbnail} src={thumbnailUrl} alt={alt} />
    </span>
  );
};
export default ModeratedThumbnail;
