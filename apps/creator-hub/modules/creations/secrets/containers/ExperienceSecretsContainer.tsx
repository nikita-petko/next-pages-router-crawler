import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import SecretsTable from '../components/SecretsTable';

// assume this will be rendered in `pages/creations/experiences/[id].tsx`
const ExperienceSecretsContainer: FunctionComponent<React.PropsWithChildren> = () => {
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
