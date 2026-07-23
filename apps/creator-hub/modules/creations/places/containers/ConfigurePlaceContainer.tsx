import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { EmptyGrid } from '@modules/miscellaneous/common/components/EmptyGrid';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useRouter } from 'next/router';
import useCurrentPlace from '../hooks/useCurrentPlace';
import ConfigurePlaceForm from '../components/ConfigurePlaceForm';

export type placeConfiguration = {
  id: number;
  name: string;
  description?: string;
};

const ConfigurePlaceContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { gameDetails, isLoadingGame, canConfigure } = useCurrentGame();
  const { placeDetails, isPlaceLoading, canConfigurePlace, refreshPlaceDetails } =
    useCurrentPlace();
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isPlaceInfoReady, setIsPlaceInfoReady] = useState<boolean>(false);
  const [placeConfiguration, setPlaceConfiguration] = useState<placeConfiguration | null>(null);
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
