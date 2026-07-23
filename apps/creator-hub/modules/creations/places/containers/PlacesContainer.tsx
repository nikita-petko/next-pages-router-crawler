import React, { FunctionComponent, useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { EmptyGrid, Item } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import PlacesGridContainer from './PlacesGridContainer';

const PlacesContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const { canConfigure, gameDetails, refreshGameDetails, isLoadingGame } = useCurrentGame();

  const handlePageReload = useCallback(async () => {
    await refreshGameDetails();
  }, [refreshGameDetails]);

  if (isLoadingGame) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!gameDetails || !gameDetails.id || !gameDetails.rootPlaceId) {
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
    <PlacesGridContainer
      universeId={gameDetails.id}
      rootplaceId={gameDetails.rootPlaceId}
      itemType={Item.Places}
    />
  );
};

export default withTranslation(PlacesContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Places,
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
]);
