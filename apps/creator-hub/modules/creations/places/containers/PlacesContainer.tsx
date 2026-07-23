import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { Item } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import PlacesGridContainer from './PlacesGridContainer';

const PlacesContainer: FunctionComponent<React.PropsWithChildren> = () => {
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
