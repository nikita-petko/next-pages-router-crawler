import React, { FunctionComponent, useCallback } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress } from '@rbx/ui';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import SecretsTable from '../components/SecretsTable';

// assume this will be rendered in `pages/creations/experiences/[id].tsx`
const ExperienceSecretsContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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

  if (!gameDetails || !gameDetails.id) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handlePageReload}
      />
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return <SecretsTable universeId={gameDetails.id} />;
};

export default withTranslation(ExperienceSecretsContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Controls,
  TranslationNamespace.Secrets,
]);
