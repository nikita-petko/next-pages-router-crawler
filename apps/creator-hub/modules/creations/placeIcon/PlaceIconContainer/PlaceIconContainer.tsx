import React, { FunctionComponent, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { EmptyGrid } from '@modules/miscellaneous/common/components/EmptyGrid';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useRouter } from 'next/router';
import PlaceIconFormV2 from '../PlaceIconForm/PlaceIconFormV2';

const PlaceIconContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { gameDetails, isLoadingGame, canConfigure, refreshGameDetails } = useCurrentGame();
  const { translate } = useTranslation();

  const { query: routerQuery, isReady: isRouterReady } = useRouter();
  const placeId = useMemo(() => {
    if (isRouterReady) {
      const { placeId: routerPlaceId } = routerQuery;
      const parsedId = parseInt(routerPlaceId as string, 10);
      return parsedId > 0 ? parsedId : undefined;
    }
    return undefined;
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
