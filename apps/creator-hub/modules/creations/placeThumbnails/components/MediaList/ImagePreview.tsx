import React, { FC, useCallback, useEffect, useRef } from 'react';
import useThumbnailImage from '@modules/miscellaneous/common/components/ThumbnailImage/useThumbnailImage';
import { ThumbnailTypes, ThumbnailResponseState, ReturnPolicy } from '@rbx/thumbnails';
import {
  HourglassEmptyIcon,
  NotInterestedIcon,
  BrokenImageOutlinedIcon,
  Skeleton,
  Button,
  useDialog,
} from '@rbx/ui';
import { Media, MediaType } from '../../types/Media';
import useMediaListStyles from './MediaList.styles';
import ImagePreviewInDialog from './ImagePreviewInDialog';

const ImagePreviewAllowed: FC<{ item: Media & { type: MediaType.Image } }> = ({ item }) => {
  const {
    classes: { preview, inCompletePreview, inCompletePreviewIcon },
  } = useMediaListStyles();
  const { id: assetId } = item;

  const { configure, open } = useDialog();
  const onClick = useCallback(() => {
    configure(<ImagePreviewInDialog item={item} />);
    open();
  }, [configure, item, open]);

  const { thumbnailData, refreshThumbnail } = useThumbnailImage({
    targetId: assetId,
    targetType: ThumbnailTypes.assetThumbnail,
    returnPolicy: ReturnPolicy.PlaceHolder,
    fontColor: 'dark',
  });

  /** Refresh thumbnail every 5 seconds if it's in review/unavailable/pending state */
  const refreshThumbnailTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      thumbnailData?.state === ThumbnailResponseState.InReview ||
      thumbnailData?.state === ThumbnailResponseState.TemporarilyUnavailable ||
      thumbnailData?.state === ThumbnailResponseState.Pending
    ) {
      if (!refreshThumbnailTimerRef.current) {
        refreshThumbnailTimerRef.current = window.setInterval(() => {
          refreshThumbnail();
        }, 5000);
      }
    } else if (refreshThumbnailTimerRef.current) {
      clearTimeout(refreshThumbnailTimerRef.current);
    }
  }, [refreshThumbnail, thumbnailData?.state]);

  useEffect(() => {
    return () => {
      if (refreshThumbnailTimerRef.current) {
        clearTimeout(refreshThumbnailTimerRef.current);
      }
    };
  }, []);

  switch (thumbnailData?.state) {
    case ThumbnailResponseState.Completed:
      return (
        <Button
          disableRipple
          onClick={onClick}
          role='img'
          style={{
            backgroundImage: `url(${thumbnailData?.imageUrl})`,
            backgroundColor: 'transparent',
            padding: 0,
            borderRadius: 0,
          }}
          classes={{ root: preview }}
        />
      );
    case ThumbnailResponseState.InReview:
      return (
        <div className={inCompletePreview}>
          <HourglassEmptyIcon fontSize='large' classes={{ root: inCompletePreviewIcon }} />
        </div>
      );
    case ThumbnailResponseState.Blocked:
      return (
        <div className={inCompletePreview}>
          <NotInterestedIcon fontSize='large' classes={{ root: inCompletePreviewIcon }} />
        </div>
      );
    case ThumbnailResponseState.Error:
    case ThumbnailResponseState.TemporarilyUnavailable:
      return (
        <Button disableRipple onClick={onClick} role='img' classes={{ root: inCompletePreview }}>
          <BrokenImageOutlinedIcon
            fontSize='large'
            classes={{ root: inCompletePreviewIcon }}
            color='secondary'
          />
        </Button>
      );
    case ThumbnailResponseState.Pending:
    default:
      return (
        <div className={inCompletePreview}>
          <Skeleton
            width={110}
            height='100%'
            animate
            variant='rectangular'
            style={{ borderRadius: 0 }}
          />
        </div>
      );
  }
};

// The reason we need to a separate component for thumbnail that doesn't pass permission check is because
// useThumbnailImage hook batches thumbnails request under the hood with v1/assets API. When one of the provided asset ids
// denies permission, the whole batch request will fail and cause none of the thumbnails to be displayed.
// Thus, to avoid this issue, we need to check permissions for each asset and only use useThumbnailImage hook for those that are allowed
// see https://roblox.slack.com/archives/CHGEFCAUT/p1715894730210749?thread_ts=1715638288.577109&cid=CHGEFCAUT
const ImagePreview: FC<{ item: Media & { type: MediaType.Image } }> = ({ item }) => {
  const {
    classes: { inCompletePreview, inCompletePreviewIcon },
  } = useMediaListStyles();

  const { configure, open } = useDialog();
  const onClick = useCallback(() => {
    configure(<ImagePreviewInDialog item={item} />);
    open();
  }, [configure, item, open]);
  return item.allowedToUse ? (
    <ImagePreviewAllowed item={item} />
  ) : (
    <Button disableRipple onClick={onClick} role='img' classes={{ root: inCompletePreview }}>
      <BrokenImageOutlinedIcon
        fontSize='large'
        classes={{ root: inCompletePreviewIcon }}
        color='secondary'
      />
    </Button>
  );
};

export default ImagePreview;
