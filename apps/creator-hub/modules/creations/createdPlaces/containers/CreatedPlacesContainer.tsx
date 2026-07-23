import { useCallback } from 'react';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import CreatedPlacesGridContainer from './CreatedPlacesGridContainer';

const CreatedPlacesContainer = () => {
  const { translate } = useTranslation();
  const { canConfigure, gameDetails, refreshGameDetails, isLoadingGame } = useCurrentGame();

  const handlePageReload = useCallback(async () => {
    await refreshGameDetails();
  }, [refreshGameDetails]);

  if (isLoadingGame === true) {
    return <PageLoading />;
  }

  if (canConfigure === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!gameDetails) {
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
    <Grid container direction='column'>
      <CreatedPlacesGridContainer universeId={gameDetails?.id ?? 0} />
    </Grid>
  );
};

export default withTranslation(CreatedPlacesContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Places,
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
]);
