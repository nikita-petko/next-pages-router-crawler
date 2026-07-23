import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import developClient from '@modules/clients/develop';
import universesClient from '@modules/clients/universes';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  defaultCustomSocialSlots,
  defaultHasPlaceOverride,
  defaultIsSpecificJoinToNonRootPlacesAllowed,
  defaultIsRootPlace,
  defaultMaxPlayersAllowed,
  defaultMaxPlayerCount,
} from '../components/constants';
import PlaceAccessForm from '../components/PlaceAccessForm';
import { PlaceAccessSocialSlotStrategy, PlaceJoinRestrictionType } from '../components/types';

const PlaceAccessContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { isFetched } = useSettings();
  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const { canConfigure, isLoadingGame, gameDetails, refreshGameDetails } = useCurrentGame();
  const [isDataFetched, setIsDataFetched] = useState<boolean>(false);
  const [failedToGetData, setFailedToGetData] = useState<boolean>(false);
  const [maxPlayersAllowed, setMaxPlayersAllowed] = useState<number>(defaultMaxPlayersAllowed);
  const [maxPlayerCount, setMaxPlayerCount] = useState<number>(defaultMaxPlayerCount);
  const [socialSlotStrategy, setSocialSlotStrategy] = useState<PlaceAccessSocialSlotStrategy>(
    PlaceAccessSocialSlotStrategy.RobloxOptimized,
  );
  const [customSocialSlotsCount, setCustomSocialSlotsCount] =
    useState<number>(defaultCustomSocialSlots);

  const [isSpecificJoinToNonRootPlacesAllowed, setIsSpecificJoinToNonRootPlacesAllowed] =
    useState<boolean>(defaultIsSpecificJoinToNonRootPlacesAllowed);
  const [hasPlaceOverride, setHasPlaceOverride] = useState<boolean>(defaultHasPlaceOverride);
  const [isRootPlace, setIsRootPlace] = useState<boolean>(defaultIsRootPlace);
  const [placeJoinRestrictionType, setPlaceJoinRestrictionType] =
    useState<PlaceJoinRestrictionType>(PlaceJoinRestrictionType.Legacy);

  const placeId = useMemo(() => {
    if (isRouterReady) {
      const { placeId: routerPlaceId } = routerQuery;
      const parsedId = parseInt(routerPlaceId as string, 10);
      return parsedId > 0 ? parsedId : undefined;
    }
    return null;
  }, [routerQuery, isRouterReady]);

  const getPlaceAccessSettings = useCallback(async () => {
    try {
      if (!placeId) {
        return;
      }
      setFailedToGetData(false);

      const response = await developClient.getPlaceDetailInfo({ placeId });
      setMaxPlayersAllowed(response.maxPlayersAllowed ?? defaultMaxPlayersAllowed);
      setMaxPlayerCount(response.maxPlayerCount ?? defaultMaxPlayerCount);
      setCustomSocialSlotsCount(response.customSocialSlotsCount ?? defaultCustomSocialSlots);
      setSocialSlotStrategy(
        (response.socialSlotType ?? 'Automatic') as PlaceAccessSocialSlotStrategy,
      );
      setIsRootPlace(response.isRootPlace ?? defaultIsRootPlace);

      if (!response.isRootPlace) {
        const placeJoinRestrictionResponse = await universesClient.getPlaceJoinRestrictions({
          placeId,
        });

        const responseType = placeJoinRestrictionResponse.placeJoinRestrictionType;
        const isAllowed =
          placeJoinRestrictionResponse.isSpecificJoinToNonRootPlacesAllowed ??
          defaultIsSpecificJoinToNonRootPlacesAllowed;

        let joinRestrictionType;
        if (!responseType || responseType === PlaceJoinRestrictionType.Default) {
          joinRestrictionType = isAllowed
            ? PlaceJoinRestrictionType.Open
            : PlaceJoinRestrictionType.Legacy;
        } else {
          joinRestrictionType = responseType;
        }

        setPlaceJoinRestrictionType(joinRestrictionType);
        setIsSpecificJoinToNonRootPlacesAllowed(
          joinRestrictionType === PlaceJoinRestrictionType.Open,
        );
        setHasPlaceOverride(
          placeJoinRestrictionResponse.hasPlaceOverride ?? defaultHasPlaceOverride,
        );
      }

      setIsDataFetched(true);
    } catch {
      setFailedToGetData(true);
    }
  }, [placeId]);

  const handlePageReload = useCallback(async () => {
    setFailedToGetData(false);
    setIsDataFetched(false);
    await refreshGameDetails();
    getPlaceAccessSettings();
  }, [getPlaceAccessSettings, refreshGameDetails]);

  useEffect(() => {
    if (placeId) {
      getPlaceAccessSettings();
    }
  }, [getPlaceAccessSettings, placeId]);

  if (isLoadingGame || !isFetched || (!isDataFetched && !failedToGetData)) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!placeId) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (!gameDetails || failedToGetData) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handlePageReload}
      />
    );
  }

  return (
    <PlaceAccessForm
      placeId={placeId}
      maxPlayersAllowed={maxPlayersAllowed}
      maxPlayerCount={maxPlayerCount}
      socialSlotStrategy={socialSlotStrategy}
      customSocialSlotsCount={customSocialSlotsCount}
      isSpecificJoinToNonRootPlacesAllowed={isSpecificJoinToNonRootPlacesAllowed}
      hasPlaceOverride={hasPlaceOverride}
      isRootPlace={isRootPlace}
      placeJoinRestrictionType={placeJoinRestrictionType}
    />
  );
};

export default withTranslation(PlaceAccessContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.PlaceAccess,
]);
