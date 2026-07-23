import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Container, makeStyles } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { Flex } from '@modules/miscellaneous/components/Flex';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GenerateImageButton from '../components/GenerateImageButton';
import PlaceMediaList from '../components/PlaceMediaList';
import ThumbnailUploadButton from '../components/ThumbnailUploadButton';
import UploadVideoInVideosTabBanner from '../components/UploadVideoInVideosTabBanner';
import useGamePreviewVideoForPlaceQuery from '../hooks/useGamePreviewVideoForPlaceQuery';
import usePlaceMediaUploadControls, {
  maxThumbnailsOnEDP,
} from '../hooks/usePlaceMediaUploadControls';

const useStyles = makeStyles()(() => {
  return {
    videoBanner: {
      marginTop: '20px',
    },
    buttonsContainer: {
      marginBottom: '20px',
      marginTop: '20px',
    },
  };
});

type ExperienceDetailPageTabContentProps = {
  placeId: number;
  userId: number;
  universeId?: number;
  canConfigurePlace?: boolean;
};

const ExperienceDetailPageTabContent: FC<ExperienceDetailPageTabContentProps> = ({
  placeId,
  userId,
  universeId,
  canConfigurePlace,
}: ExperienceDetailPageTabContentProps) => {
  const {
    classes: { videoBanner, buttonsContainer },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  const { hasExceededMaxThumbnails, isAuthorizedToConfigure, isLoading, isPlaceMediaLoading } =
    usePlaceMediaUploadControls(placeId, userId, universeId);

  const buttonDisabled = isPlaceMediaLoading || hasExceededMaxThumbnails;

  const buttonTooltip = useMemo<FormattedText | undefined>(() => {
    if (!hasExceededMaxThumbnails) {
      return undefined;
    }

    return translate(
      translationKey('Description.MaxThumbnailsReached', TranslationNamespace.PlaceThumbnails),
      {
        limit: maxThumbnailsOnEDP.toString(),
      },
    );
  }, [hasExceededMaxThumbnails, translate]);

  const [isAssetUploading, setIsAssetUploading] = useState(false);

  // Although Video upload is in a separate page, we still fetch the videoPreview to preserve the video as the
  // first entry in the media list for the place after any re-ordering of the thumbnails in useReorderThumbnailsForPlaceMutation.
  const isReadyToFetchGamePreviewVideo =
    !isLoading && canConfigurePlace === true && isAuthorizedToConfigure === true;

  const { data: gamePreviewVideo, isPending: isGamePreviewVideoPending } =
    useGamePreviewVideoForPlaceQuery(placeId, undefined, {
      enabled: isReadyToFetchGamePreviewVideo,
      shouldFetchContentQuality: false,
    });

  if (isLoading || (isReadyToFetchGamePreviewVideo && isGamePreviewVideoPending)) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!canConfigurePlace || !isAuthorizedToConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <Container disableGutters maxWidth={false}>
      {universeId && (
        <UploadVideoInVideosTabBanner
          placeId={placeId}
          universeId={universeId}
          className={videoBanner}
        />
      )}
      <Flex classes={{ root: buttonsContainer }} gap={8} flexWrap='wrap'>
        <ThumbnailUploadButton
          placeId={placeId}
          userId={userId}
          disabled={buttonDisabled}
          tooltip={buttonTooltip}
          onUploadStatusChange={setIsAssetUploading}
        />
        <GenerateImageButton
          placeId={placeId}
          userId={userId}
          disabled={buttonDisabled}
          tooltip={buttonTooltip}
          onUploadStatusChange={setIsAssetUploading}
        />
      </Flex>
      <PlaceMediaList
        placeId={placeId}
        userId={userId}
        isAssetUploading={isAssetUploading}
        videoPreview={gamePreviewVideo?.videoPreview}
      />
    </Container>
  );
};

export default withTranslation(ExperienceDetailPageTabContent, [
  TranslationNamespace.Controls,
  TranslationNamespace.Creations,
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Analytics,
  TranslationNamespace.Error,
]);
