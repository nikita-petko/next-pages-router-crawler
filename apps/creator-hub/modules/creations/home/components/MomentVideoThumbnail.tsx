import type { FC, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { Popover, PopoverAnchor, PopoverContent } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { RobloxVideoPlayer } from '@rbx/video-player';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MOMENT_VIDEO_THUMBNAIL_SIZE_PX } from '../constants/momentsVideoMediaConstants';
import { useMomentVideoMedia } from '../hooks/useMomentVideoMedia';
import type { MomentCreation } from '../types/MomentCreation';
import type { StoredMomentCreation } from '../types/StoredMomentCreation';

const VIDEO_PLAYER_ENVIRONMENT =
  process.env.targetEnvironment === 'production' ? 'production' : 'sitetest1';

type MomentVideoThumbnailProps = {
  moment: MomentCreation | StoredMomentCreation;
};

const MomentVideoThumbnail: FC<MomentVideoThumbnailProps> = ({ moment }) => {
  const { translate } = useTranslation();
  const hasLocalVideo = 'hasLocalVideo' in moment && moment.hasLocalVideo === true;
  const mediaUrls = useMomentVideoMedia(moment.id, {
    enabled: hasLocalVideo,
    thumbnailUrl: moment.thumbnailUrl,
    videoUrl: moment.videoUrl,
  });
  const { assetId } = moment;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const previewLabel = translate('Label.MomentVideoPreview' /* TranslationNamespace.Creations */);

  // Drafts play a local blob video; Active moments play the published video asset.
  const hasPreview = Boolean(mediaUrls?.videoUrl) || assetId != null;

  const openPreview = useCallback(() => {
    if (!hasPreview) {
      return;
    }
    setIsPreviewOpen(true);
  }, [hasPreview]);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  let thumbnail: ReactNode;
  if (mediaUrls?.thumbnailUrl) {
    thumbnail = (
      <img
        alt=''
        className='radius-small [object-fit:cover]'
        data-testid='moment-video-thumbnail-image'
        height={MOMENT_VIDEO_THUMBNAIL_SIZE_PX}
        src={mediaUrls.thumbnailUrl}
        width={MOMENT_VIDEO_THUMBNAIL_SIZE_PX}
      />
    );
  } else if (assetId != null) {
    thumbnail = (
      <div className='radius-small clip size-[48px]' data-testid='moment-video-thumbnail-image'>
        <Thumbnail2d
          alt=''
          containerClass='block'
          imgClassName='[object-fit:cover]'
          returnPolicy={ReturnPolicy.PlaceHolder}
          targetId={assetId}
          type={ThumbnailTypes.assetThumbnail}
        />
      </div>
    );
  } else {
    thumbnail = <div aria-hidden className='radius-small bg-surface-200 size-[48px]' />;
  }

  let previewContent: ReactNode = null;
  if (mediaUrls?.videoUrl) {
    previewContent = (
      <video
        aria-label={previewLabel}
        autoPlay
        className='radius-medium block max-width-[500px] max-height-[500px]'
        loop
        muted
        playsInline
        src={mediaUrls.videoUrl}
      />
    );
  } else if (assetId != null) {
    previewContent = (
      <div
        aria-label={previewLabel}
        className='radius-medium clip max-width-[500px] max-height-[500px] bg-surface-200'>
        <RobloxVideoPlayer
          videoAssetId={String(assetId)}
          environment={VIDEO_PLAYER_ENVIRONMENT}
          src={undefined}
          autoPlay
          disableControls
          loop
          muted
        />
      </div>
    );
  }

  if (!hasPreview) {
    return thumbnail;
  }

  return (
    <Popover open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <PopoverAnchor asChild>
        <button
          aria-label={previewLabel}
          className='padding-none bg-none stroke-none'
          type='button'
          onPointerEnter={openPreview}
          onPointerLeave={closePreview}
          onFocus={openPreview}
          onBlur={closePreview}>
          {thumbnail}
        </button>
      </PopoverAnchor>
      <PopoverContent align='start' ariaLabel={previewLabel} className='outline-none' side='bottom'>
        {previewContent}
      </PopoverContent>
    </Popover>
  );
};

export default withTranslation(MomentVideoThumbnail, [TranslationNamespace.Creations]);
