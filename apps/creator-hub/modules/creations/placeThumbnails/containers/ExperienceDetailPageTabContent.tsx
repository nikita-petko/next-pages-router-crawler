import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Preview } from '@rbx/clients/assetsUploadApi';
import { CircularProgress, Container, makeStyles } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Flex } from '@modules/miscellaneous/common/components';
import { useQuery } from '@tanstack/react-query';
import { economyClient, tryParseResponseError } from '@modules/clients';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { FormattedText } from '@modules/analytics-translations';
import { getUniverseConfiguration } from '@modules/react-query/develop/universeApiRequest';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import UploadVideoButton from '../components/UploadVideoButton';
import ThumbnailUploadButton from '../components/ThumbnailUploadButton';
import VideoUploadWrapper from '../components/VideoUploadWrapper';
import useGetUserBalanceQuery from '../hooks/useGetUserBalanceQuery';
import GenerateImageButton from '../components/GenerateImageButton';
import useGetPlaceMediaQuery from '../hooks/useGetPlaceMediaQuery';
import PlaceMediaList from '../components/PlaceMediaList';

const videoProductId = 11588965; // NOTE (lguan,02/09/22): This Product ID represents the video thumbnail. It is used retrieving it's price.
const maxThumbnailsOnEDP = 10;

const useStyles = makeStyles()(() => {
  return {
    buttonsContainer: {
      marginBottom: '20px',
      marginTop: '36px',
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
    classes: { buttonsContainer },
  } = useStyles();
  const { translate } = useTranslation();
  const { isGamePreviewVideoUploadEnabled } = useFeatureFlagsForNamespace(
    'isGamePreviewVideoUploadEnabled',
    FeatureFlagNamespace.Analytics,
  );

  const { data: userBalance, isPending: isLoadingUserBalance } = useGetUserBalanceQuery(userId);

  const { data: videoThumbnailPrice, isPending: isLoadingVideoPice } = useQuery({
    queryKey: ['getVideoProductPrice', videoProductId],
    queryFn: async () => {
      const response = await economyClient.getProductPrice(videoProductId);
      return response.price ?? null;
    },
  });

  const { data: isExperiencePrivate, isPending: isLoadingPrivacyStatus } = useQuery({
    queryKey: ['getUniversePrivacyType', universeId],
    queryFn: async () => {
      if (!universeId) return false;
      const universeConfig = await getUniverseConfiguration(universeId);
      return universeConfig?.privacyType === 'Private';
    },
    enabled: !!universeId,
  });

  const [videoPreview, setVideoPreview] = useState<Preview | undefined>();
  const { failureReason, isPending: isLoadingPlaceMedia } = useGetPlaceMediaQuery(placeId, userId);
  const [isAuthorizedToConfigure, setIsAuthorizedToConfigure] = useState(false);
  useEffect(() => {
    tryParseResponseError(failureReason).then((error) => {
      if (error) {
        // TODO(tyin): use PlacesError enum after movine this component to creations
        setIsAuthorizedToConfigure(error.code !== 2);
      } else {
        setIsAuthorizedToConfigure(true);
      }
    });
  }, [failureReason]);

  const { data: medias, isPending } = useGetPlaceMediaQuery(placeId, userId);

  const getButtonTooltip = useCallback(
    (
      isLoading: boolean,
      hasExceededMaxThumbnails: boolean,
      isPrivate: boolean,
    ): FormattedText | undefined => {
      if (isPrivate) {
        return translate(
          'Tooltip.VideoUploadDisabledExperienceMustBePublic' /** TranslationNamespace.PlaceThumbnails */,
        ) as FormattedText;
      }
      if (hasExceededMaxThumbnails) {
        return translate(
          'Description.MaxThumbnailsReached' /** TranslationNamespace.PlaceThumbnails */,
          {
            limit: maxThumbnailsOnEDP.toString(),
          },
        ) as FormattedText;
      }
      if (isLoading) {
        return undefined; // No tooltip while loading
      }
      return undefined;
    },
    [translate],
  );

  const { buttonDisabled, buttonTooltip } = useMemo(() => {
    const exceededMaxThumbnails = medias && medias?.length >= maxThumbnailsOnEDP;
    const disabled = isPending || exceededMaxThumbnails || !!isExperiencePrivate;
    return {
      buttonDisabled: disabled,
      buttonTooltip: getButtonTooltip(isPending, !!exceededMaxThumbnails, !!isExperiencePrivate),
    };
  }, [isPending, medias, isExperiencePrivate, getButtonTooltip]);

  const [isAssetUploading, setIsAssetUploading] = useState(false);

  if (isLoadingUserBalance || isLoadingVideoPice || isLoadingPlaceMedia || isLoadingPrivacyStatus) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!canConfigurePlace || !isAuthorizedToConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (videoThumbnailPrice == null || userBalance == null) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
      />
    );
  }

  return (
    <Container disableGutters maxWidth={false}>
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
        {!isGamePreviewVideoUploadEnabled && (
          <UploadVideoButton
            userBalance={userBalance}
            videoThumbnailPrice={videoThumbnailPrice}
            placeId={placeId}
            userId={userId}
            disabled={buttonDisabled}
            tooltip={buttonTooltip}
          />
        )}
      </Flex>
      {isGamePreviewVideoUploadEnabled && (
        <VideoUploadWrapper
          placeId={placeId}
          userId={userId}
          onVideoPreviewChange={setVideoPreview}
          isUploadDisabled={buttonDisabled}
          uploadButtonTooltip={buttonTooltip}
        />
      )}
      <PlaceMediaList
        placeId={placeId}
        userId={userId}
        isAssetUploading={isAssetUploading}
        videoPreview={videoPreview}
      />
    </Container>
  );
};

export default withTranslation(ExperienceDetailPageTabContent, [
  TranslationNamespace.Controls,
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Analytics,
  TranslationNamespace.Error,
]);
