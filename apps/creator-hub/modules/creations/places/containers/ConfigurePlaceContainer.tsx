import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components/EmptyGrid';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ConfigurePlaceForm from '../components/ConfigurePlaceForm';
import useCurrentPlace from '../hooks/useCurrentPlace';
import type { PlaceConfiguration } from '../types/PlaceConfiguration';

const ConfigurePlaceContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { gameDetails, isLoadingGame, canConfigure } = useCurrentGame();
  const { placeDetails, isPlaceLoading, canConfigurePlace, refreshPlaceDetails } =
    useCurrentPlace();
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isPlaceInfoReady, setIsPlaceInfoReady] = useState<boolean>(false);
  const [placeConfiguration, setPlaceConfiguration] = useState<PlaceConfiguration | null>(null);
  const router = useRouter();
  const { translate } = useTranslation();

  const updatePlaceConfiguration = useCallback(async () => {
    if (
      typeof placeDetails !== 'undefined' &&
      typeof placeDetails.id !== 'undefined' &&
      typeof placeDetails.name !== 'undefined'
    ) {
      setPlaceConfiguration({
        id: placeDetails.id,
        name: placeDetails.name,
        description: placeDetails.description,
      });

      setIsPlaceInfoReady(true);
    }
  }, [placeDetails]);

  useEffect(() => {
    updatePlaceConfiguration();
  }, [updatePlaceConfiguration]);

  const handleReload = useCallback(() => {
    router.reload();
  }, [router]);

  const refreshData = () => {
    setIsInitializing(false);
    refreshPlaceDetails();
  };

  if (isLoadingGame || ((isPlaceLoading || !isPlaceInfoReady) && isInitializing)) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!canConfigure || !canConfigurePlace) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!gameDetails || !placeConfiguration) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReload}
      />
    );
  }

  return <ConfigurePlaceForm placeDetailsInfo={placeConfiguration} refreshData={refreshData} />;
};

export default withTranslation(ConfigurePlaceContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Places,
]);
