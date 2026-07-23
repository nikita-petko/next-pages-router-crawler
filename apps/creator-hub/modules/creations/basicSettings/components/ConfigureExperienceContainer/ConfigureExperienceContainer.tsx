import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import type { TGroup } from '@modules/authentication/types';
import developClient from '@modules/clients/develop';
import groupsClient from '@modules/clients/groups';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import type { User } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import GenreType from '@modules/experience-genre/enums/GenreType';
import useExperienceGenres from '@modules/experience-genre/hooks/useExperienceGenres';
import {
  getGenreAndSubgenre,
  getPlaceholderGenre,
  isPlaceholderEnum,
} from '@modules/experience-genre/utils/genreTypeUtils';
import { CreatorType } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components/EmptyGrid';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useGetExperienceGenre } from '@modules/react-query/experienceGenre';
import { fetchUserAmpStatusOfEnableMeshTextureApi } from '../../utils/checkConfigureEligibility';
import ConfigureExperienceForm from '../ConfigureExperienceForm/ConfigureExperienceForm';
import type { UniverseConfiguration } from '../ConfigureExperienceTypes';

const VALID_AUDIENCE_VALUES = new Set<number>([
  Audience.Editors,
  Audience.PlayTesters,
  Audience.Friends,
  Audience.Public,
]);

const parseAudiences = (raw: unknown): Audience[] | undefined => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined;
  }
  const valid = raw.filter((v): v is Audience => VALID_AUDIENCE_VALUES.has(Number(v)));
  return valid.length > 0 ? valid : undefined;
};
import { Audience, Privacy } from '../ConfigureExperienceTypes';

const ConfigureExperienceContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    params: { enableAudienceControls },
    isFetched: isCreationsPermissionIxpFetched,
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);

  const { gameDetails, isLoadingGame, isErrorLoadingGame, canConfigure, refreshGameDetails } =
    useCurrentGame();
  const { translate } = useTranslation();
  const [isUniverseDetailReady, setIsUniverseDetailReady] = useState<boolean>(false);
  const [isGetUniverseDetailFailed, setIsGetUniverseDetailFailed] = useState<boolean>(false);
  const [universeConfiguration, setUniverseConfiguration] = useState<UniverseConfiguration | null>(
    null,
  );
  const [ampStatusOfEnableMeshTextureApi, setAmpStatusOfEnableMeshTextureApi] =
    useState<string>('Denied');
  const [isOwnerOrGroupOwner, setIsOwnerOrGroupOwner] = useState<boolean>(false);
  const [experienceCreator, setExperienceCreator] = useState<User | TGroup>();
  const [isPublicConnectionsDisabled, setIsPublicConnectionsDisabled] = useState<boolean>(false);

  const { user } = useAuthentication();

  // oxlint-disable-next-line typescript-eslint/no-unsafe-assignment
  const { genreToSubgenre, subgenreToGenre } = useExperienceGenres();

  const { data: genreResponse, status: genreStatus } = useGetExperienceGenre(gameDetails?.id);

  const getUniverseDetails = useCallback(async () => {
    setIsUniverseDetailReady(false);
    setIsGetUniverseDetailFailed(false);
    try {
      if (gameDetails && gameDetails.id) {
        const developResponse = await developClient.getUniverseConfiguration(gameDetails.id);
        const developResponseV2 = await developClient.getUniverseConfigurationV2(gameDetails.id);
        if (
          typeof gameDetails.name !== 'undefined' &&
          typeof developResponse.privacyType !== 'undefined' &&
          typeof developResponse.isStudioAccessToApisAllowed !== 'undefined' &&
          typeof developResponse.isMeshTextureApiAccessAllowed !== 'undefined'
        ) {
          let privacy = developResponse.privacyType === 'Public' ? Privacy.Public : Privacy.Private;
          if (developResponseV2?.isFriendsOnly && privacy === Privacy.Public) {
            privacy = Privacy.PublicConnections;
          }
          setIsPublicConnectionsDisabled(
            (developResponseV2?.isForSale ?? false) ||
              (developResponseV2?.isForSaleInFiat ?? false),
          );

          let genre = '';
          let subgenre = '';
          if (genreStatus === 'success') {
            const result = getGenreAndSubgenre(
              // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
              genreResponse.genre as GenreType,
              genreToSubgenre,
              // oxlint-disable-next-line typescript-eslint/no-unsafe-argument
              subgenreToGenre,
            );
            genre = result.genre;
            subgenre = result.subgenre;
          }
          setUniverseConfiguration({
            id: gameDetails.id,
            name: gameDetails.name,
            genre,
            subgenre,
            description: gameDetails.description ?? '',
            privacy,
            audiences: parseAudiences(developResponse.audiences),
            isStudioAccessToApisAllowed: developResponse.isStudioAccessToApisAllowed,
            isMeshTextureApiAccessAllowed: developResponse.isMeshTextureApiAccessAllowed,
          });
        }
      }
    } catch {
      setIsGetUniverseDetailFailed(true);
    } finally {
      setIsUniverseDetailReady(true);
    }
  }, [gameDetails, genreResponse, genreStatus, genreToSubgenre, subgenreToGenre]);

  const getAmpStatus = useCallback(async () => {
    try {
      const status = await fetchUserAmpStatusOfEnableMeshTextureApi();
      if (typeof status !== 'undefined') {
        setAmpStatusOfEnableMeshTextureApi(status);
      }
    } catch {
      setAmpStatusOfEnableMeshTextureApi('Denied');
    }
  }, []);

  const getOwnershipStatus = useCallback(async () => {
    setIsOwnerOrGroupOwner(false);
    if (gameDetails && gameDetails.id && user) {
      const isGroup = gameDetails.creator?.type === CreatorType.Group;
      if (isGroup) {
        const groupId = gameDetails.creator?.id;
        if (groupId) {
          try {
            const groupInfoResponse = await groupsClient.getGroupInfo(groupId);
            const groupOwnerId = groupInfoResponse.owner?.userId;
            setIsOwnerOrGroupOwner(groupOwnerId === user.id);
            setExperienceCreator(groupInfoResponse);
          } catch {
            setIsOwnerOrGroupOwner(false);
          }
        }
      } else if (user.id === gameDetails.creator?.id) {
        setIsOwnerOrGroupOwner(true);
        setExperienceCreator(user);
      } else {
        setIsOwnerOrGroupOwner(false);
        try {
          if (gameDetails.creator?.id) {
            const ownerResponse = await usersClient.getUserById(gameDetails.creator?.id);
            setExperienceCreator(ownerResponse);
          }
        } catch {
          setExperienceCreator(gameDetails.creator);
        }
      }
    }
  }, [gameDetails, user]);

  const handlePageReload = useCallback(() => {
    if (gameDetails && isGetUniverseDetailFailed) {
      void getUniverseDetails();
    } else {
      void refreshGameDetails();
    }
  }, [isGetUniverseDetailFailed, gameDetails, getUniverseDetails, refreshGameDetails]);

  useEffect(() => {
    void getUniverseDetails();
    void getOwnershipStatus();
    void getAmpStatus();
  }, [getUniverseDetails, getOwnershipStatus, getAmpStatus]);

  if (
    (!gameDetails || !universeConfiguration) &&
    (isLoadingGame ||
      !isUniverseDetailReady ||
      genreStatus === 'pending' ||
      !isCreationsPermissionIxpFetched)
  ) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  // If the API call did not error but the details are null, the creator is unable to view the creation due to policy reasons
  if (gameDetails === null && !isErrorLoadingGame) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} isAgeOrRegionRestricted />;
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  // Since the updateLockExpirationTime is explicitly requested, it is an error
  // if no time is returned
  if (
    isErrorLoadingGame ||
    !universeConfiguration ||
    genreStatus === 'error' ||
    !genreResponse?.details?.updateLockExpirationTime ||
    !genreResponse?.details?.creatorSelectedGenre ||
    genreResponse?.details?.notifyGenreChange === undefined
  ) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handlePageReload}
      />
    );
  }

  // Since these were checked for null/undefined above, the null coalescing values don't matter
  const genreLockExpirationTime = genreResponse?.details?.updateLockExpirationTime ?? new Date(0);
  const creatorSelectedGenre = genreResponse?.details?.creatorSelectedGenre ?? GenreType.NA;
  const notifyGenreChange = genreResponse?.details?.notifyGenreChange ?? false;

  // We don't want to expose the concept of other_{genre}, so coalesce into the
  // upper level genre
  const displayCreatorSelectedGenre = isPlaceholderEnum(creatorSelectedGenre)
    ? getPlaceholderGenre(creatorSelectedGenre)
    : creatorSelectedGenre;
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const actualGenreEnum = genreResponse?.genre as GenreType;
  const displayActualGenre = isPlaceholderEnum(actualGenreEnum)
    ? getPlaceholderGenre(actualGenreEnum)
    : actualGenreEnum;

  return (
    <ConfigureExperienceForm
      universeConfiguration={universeConfiguration}
      isUniverseConfigurationReady={isUniverseDetailReady}
      isAmpStatusOfEnableMeshTextureApi={ampStatusOfEnableMeshTextureApi}
      isOwnerOrGroupOwner={isOwnerOrGroupOwner}
      genreLockExpirationTime={genreLockExpirationTime}
      updatedGenreBannerProps={{
        displayCreatorSelectedGenre,
        displayActualGenre,
        notifyGenreChange,
      }}
      experienceCreator={experienceCreator}
      isPublicConnectionsDisabled={isPublicConnectionsDisabled}
      enableAudienceControls={Boolean(enableAudienceControls)}
    />
  );
};

export default withTranslation(ConfigureExperienceContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Navigation,
  TranslationNamespace.Genres,
  TranslationNamespace.ExperienceReleases,
  TranslationNamespace.PublicPublish,
]);
