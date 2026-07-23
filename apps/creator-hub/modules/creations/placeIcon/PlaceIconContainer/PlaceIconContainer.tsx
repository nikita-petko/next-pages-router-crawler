import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components/EmptyGrid';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import PlaceIconFormV2 from '../PlaceIconForm/PlaceIconFormV2';

const PlaceIconContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { gameDetails, isLoadingGame, canConfigure, refreshGameDetails } = useCurrentGame();
  const { translate } = useTranslation();

  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const placeId = useMemo(() => {
    if (isRouterReady) {
      const { placeId: routerPlaceId } = routerQuery;
      const parsedId = parseInt(routerPlaceId as string, 10);
      return parsedId > 0 ? parsedId : undefined;
    }
    return;
  }, [routerQuery, isRouterReady]);

  if (!isLoadingGame && !gameDetails) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={refreshGameDetails}
      />
    );
  }

  if (!isLoadingGame && !canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!placeId) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (gameDetails?.id) {
    return <PlaceIconFormV2 universeId={gameDetails.id} placeId={placeId} />;
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(PlaceIconContainer, [
  TranslationNamespace.Places,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Controls,
]);
