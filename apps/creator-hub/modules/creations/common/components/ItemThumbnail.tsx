import React, { FunctionComponent, useRef } from 'react';
import { BundleModerationStatus } from '@modules/clients/itemconfiguration';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { RobloxThumbnailsApisModelsThumbnailBatchRequestTypeEnum } from '@rbx/clients/thumbnails';
import { Item } from '@modules/miscellaneous/common';
import useGetThumbnailUrlsMap from '@modules/react-query/thumbnail/useThumbnailQueries';
import ModeratedThumbnail from './ModeratedThumbnail';
import useItemThumbnailStyles from './ItemThumbnail.styles';

export interface ItemThumbnailProps {
  containerClass: string;
  moderatedContainerClass: string;
  bundleModerationStatus: BundleModerationStatus | undefined;
  type: ThumbnailTypes;
  targetId: number;
  returnPolicy: ReturnPolicy;
  alt: string;
  isPendingNewTarget: boolean;
  itemType?: Item;
}

// TODO(jonnywu): Move this logic into @rbx/thumbnails
const ItemThumbnail: FunctionComponent<React.PropsWithChildren<ItemThumbnailProps>> = ({
  containerClass,
  moderatedContainerClass,
  bundleModerationStatus,
  type,
  targetId,
  returnPolicy,
  alt,
  isPendingNewTarget,
  itemType,
}) => {
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const {
    classes: { thumbnailWithBackground, thumbnailImage },
    cx,
  } = useItemThumbnailStyles();

  const showBundleModeratedThumbnail =
    bundleModerationStatus !== undefined &&
    bundleModerationStatus !== BundleModerationStatus.NUMBER_3;

  const isLook = itemType === Item.Look;

  // Batch endpoint is currently only used for Look items
  const { data: thumbnailUrlsMap } = useGetThumbnailUrlsMap(
    isLook ? [targetId] : [],
    RobloxThumbnailsApisModelsThumbnailBatchRequestTypeEnum.Look,
  );

  const lookThumbnailUrl = isLook && targetId > 0 ? thumbnailUrlsMap?.get(targetId) : undefined;

  if (showBundleModeratedThumbnail) {
    return (
      <ModeratedThumbnail
        containerClass={moderatedContainerClass}
        bundleModerationStatus={bundleModerationStatus!}
        alt={alt}
      />
    );
  }

  if (isLook) {
    // TODO (@mryumae UCP-691): Add this logic to @rbx/thumbnails
    if (lookThumbnailUrl) {
      return (
        <div ref={thumbnailRef} className={cx(containerClass, thumbnailWithBackground)}>
          <img src={lookThumbnailUrl} alt={alt} className={cx(containerClass, thumbnailImage)} />
        </div>
      );
    }

    return (
      <div ref={thumbnailRef}>
        <Thumbnail2d
          containerClass={containerClass}
          type={type}
          targetId={targetId}
          returnPolicy={returnPolicy}
          alt={alt}
          isPendingNewTarget={isPendingNewTarget}
          includeBackground
        />
      </div>
    );
  }

  return (
    <Thumbnail2d
      containerClass={containerClass}
      type={type}
      targetId={targetId}
      returnPolicy={returnPolicy}
      alt={alt}
      isPendingNewTarget={isPendingNewTarget}
      includeBackground
    />
  );
};

export default ItemThumbnail;
