import type { FC } from 'react';
import React, { useMemo } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, makeStyles, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { FileUploaderProvider } from '@modules/thumbnail/context/FileUploaderProvider';
import useCurrentPlace from '../../places/hooks/useCurrentPlace';
import VideoUploadWrapper from '../components/VideoUploadWrapper';
import usePlaceMediaUploadControls, {
  maxThumbnailsOnEDP,
} from '../hooks/usePlaceMediaUploadControls';

const useStyles = makeStyles()((theme) => {
  return {
    sidePadding: {
      [theme.breakpoints.down('Medium')]: {
        padding: theme.spacing(0, 2, 2),
      },
    },
  };
});

const PlaceVideosContainer: FC = () => {
  const {
    classes: { sidePadding },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());
  const { isLoadingGame, gameDetails } = useCurrentGame();
  const universeId = gameDetails?.id;
  const { isPlaceLoading, placeDetails, canConfigurePlace } = useCurrentPlace();
  const placeId = placeDetails?.id;

  const { user } = useAuthentication();
  const userId = user?.id;

  const {
    hasExceededMaxThumbnails,
    isAuthorizedToConfigure,
    isExperiencePrivate,
    isLoading,
    isPlaceMediaLoading,
  } = usePlaceMediaUploadControls(placeId, userId, universeId);

  const videoUploadDisabled =
    isPlaceMediaLoading || isExperiencePrivate || hasExceededMaxThumbnails;

  const videoUploadTooltip = useMemo<FormattedText | undefined>(() => {
    if (isExperiencePrivate) {
      return translate(
        translationKey(
          'Tooltip.VideoUploadDisabledExperienceMustBePublic',
          TranslationNamespace.PlaceThumbnails,
        ),
      );
    }

    // Today, videos share the same upload limit of maxThumbnailsOnEDP with thumbnails, so
    // we need to disable the button if the user already has maxThumbnailsOnEDP thumbnails.
    if (hasExceededMaxThumbnails) {
      return translate(
        translationKey(
          'Description.MaxThumbnailsReachedForVideo',
          TranslationNamespace.PlaceThumbnails,
        ),
        {
          limit: maxThumbnailsOnEDP.toString(),
        },
      );
    }

    return undefined;
  }, [hasExceededMaxThumbnails, isExperiencePrivate, translate]);

  if (isLoadingGame || isPlaceLoading || isLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!universeId || !placeId) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (!userId || !canConfigurePlace || !isAuthorizedToConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <FileUploaderProvider>
      <Grid container item display='flex' flexDirection='column' classes={{ root: sidePadding }}>
        <Grid item XSmall={12} display='flex' flexDirection='column' marginBottom='36px'>
          <Typography variant='body1' color='secondary' marginTop='8px'>
            {translate(
              translationKey(
                'Description.Videos.UploadVideos',
                TranslationNamespace.PlaceThumbnails,
              ),
            )}
          </Typography>
        </Grid>
        <VideoUploadWrapper
          placeId={placeId}
          userId={userId}
          isUploadDisabled={videoUploadDisabled}
          uploadButtonTooltip={videoUploadTooltip}
          hideTitle
        />
      </Grid>
    </FileUploaderProvider>
  );
};

export default withTranslation(PlaceVideosContainer, [
  TranslationNamespace.Controls,
  TranslationNamespace.Creations,
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Error,
]);
