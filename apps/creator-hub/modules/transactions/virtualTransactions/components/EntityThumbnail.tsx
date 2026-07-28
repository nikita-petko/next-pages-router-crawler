import type { FunctionComponent } from 'react';
import React from 'react';
import type { ThumbnailTypes } from '@rbx/thumbnails';
import { ReturnPolicy } from '@rbx/thumbnails';
import useThumbnailImage from '@modules/miscellaneous/components/ThumbnailImage/useThumbnailImage';

// Shared 32px entity tile for the virtual-transactions table (product, user, or group). alt=''
// because the entity name is always rendered beside it — a non-empty alt would double-announce for
// screen readers. ReturnPolicy.PlaceHolder shows a default tile when the image is missing or fails,
// so no separate fallback text is needed. Callers key this by type+id so a row reused across
// pagination remounts on target change, discarding any in-flight request for the previous row.
const BASE_CLASS = 'shrink-0 clip bg-shift-200 size-800';

type EntityThumbnailProps = {
  targetId: number;
  thumbnailType: ThumbnailTypes;
  radiusClass: string;
};

const EntityThumbnail: FunctionComponent<EntityThumbnailProps> = ({
  targetId,
  thumbnailType,
  radiusClass,
}) => {
  const { thumbnailImage } = useThumbnailImage({
    alt: '',
    returnPolicy: ReturnPolicy.PlaceHolder,
    targetId,
    targetType: thumbnailType,
  });
  return <span className={`${BASE_CLASS} ${radiusClass}`}>{thumbnailImage}</span>;
};

export default EntityThumbnail;
