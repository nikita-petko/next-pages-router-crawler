import type { FC, ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { Alert, CloseIcon, IconButton, Link, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import useGamePreviewVideoForPlaceQuery from '@modules/creations/placeThumbnails/hooks/useGamePreviewVideoForPlaceQuery';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

const ACQUISITION_VIDEO_BANNER_DISMISSAL_KEY = 'acquisitionVideoUploadBanner';

/**
 * Banner to direct creators to the Place -> Videos tab to upload a video for their experience.
 *
 * This banner will show during our experiment to place Videos in Recommended for You on Home, and then will be removed.
 */
const AcquisitionPageVideoBanner: FC = () => {
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());

  const { user } = useAuthentication();
  const [hasUserDismissed, setHasUserDismissed] = useLocalStorage(
    `${ACQUISITION_VIDEO_BANNER_DISMISSAL_KEY}-${user?.id}`,
    false,
  );

  const { gameDetails, canConfigure } = useCurrentGame();
  const universeId = gameDetails?.id;
  const rootPlaceId = gameDetails?.rootPlaceId;

  const {
    data: currentVideoPreview,
    isFetching: isVideoPreviewFetching,
    isError: isVideoPreviewFetchError,
  } = useGamePreviewVideoForPlaceQuery(rootPlaceId ?? 0, universeId, {
    enabled: !hasUserDismissed && canConfigure === true && Boolean(universeId && rootPlaceId),
    shouldFetchContentQuality: false,
  });

  if (hasUserDismissed || canConfigure !== true || !universeId || !rootPlaceId) {
    return null;
  }

  if (isVideoPreviewFetching || isVideoPreviewFetchError) {
    return null;
  }

  if (currentVideoPreview?.videoPreviewId != null) {
    // Do not show the banner if there is already a video preview for the root place
    return null;
  }

  return (
    <Alert
      severity='info'
      variant='standard'
      action={
        <IconButton
          aria-label={translate(translationKey('Action.Dismiss', TranslationNamespace.Controls))}
          color='inherit'
          onClick={() => setHasUserDismissed(true)}
          size='small'>
          <CloseIcon color='inherit' fontSize='small' />
        </IconButton>
      }>
      <Typography variant='body2'>
        {translateHTML(
          translationKey(
            'Description.AcquisitionVideoUploadBanner',
            TranslationNamespace.Analytics,
          ),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: (chunks: ReactNode) => (
                <Link href={creatorHub.dashboard.getPlaceVideosUrl(universeId, rootPlaceId)}>
                  {chunks}
                </Link>
              ),
            },
          ],
        )}
      </Typography>
    </Alert>
  );
};

export default AcquisitionPageVideoBanner;
