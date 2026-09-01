import type { FC } from 'react';
import { FeedbackBanner, Link } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';

type UploadVideoInVideosTabBannerProps = {
  placeId: number;
  universeId: number;
  className: string;
};

/**
 * Banner to display on Thumbnails tab directing users to the new Videos tab for video uploads.
 */
const UploadVideoInVideosTabBanner: FC<UploadVideoInVideosTabBannerProps> = ({
  placeId,
  universeId,
  className,
}) => {
  const { translateHTML } = useTranslationWrapper(useTranslation());

  const videosTabLink = creatorHub.dashboard.getPlaceVideosUrl(universeId, placeId);

  return (
    <FeedbackBanner
      className={className}
      title={null}
      severity='Info'
      variant='Standard'
      layout='Inline'
      description={translateHTML(
        translationKey('Description.UploadVideoInVideosTab', TranslationNamespace.PlaceThumbnails),
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={videosTabLink} underline='always'>
                  {chunks}
                </Link>
              );
            },
          },
        ],
      )}
    />
  );
};

export default UploadVideoInVideosTabBanner;
