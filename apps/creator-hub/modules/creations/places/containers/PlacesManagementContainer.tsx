import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography, useMediaQuery } from '@rbx/ui';
import { CreatorType } from '@modules/miscellaneous/common';
import { EmptyGrid } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import CreationContextType from '../../common/enums/CreationContextType';
import PlacesManagementGridContainer from './PlacesManagementGridContainer';

const PlacesManagementContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { canConfigure, gameDetails, refreshGameDetails, isLoadingGame } = useCurrentGame();

  const handlePageReload = useCallback(async () => {
    await refreshGameDetails();
  }, [refreshGameDetails]);

  const getCreatorTargeType = useMemo(() => {
    if (gameDetails?.creator?.type === 'Group') {
      return CreatorType.Group;
    }
    return CreatorType.User;
  }, [gameDetails]);

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
      <Grid item container justifyContent={isCompactView ? 'center' : 'flex-start'}>
        <Typography variant={isCompactView ? 'h4' : 'h1'}>
          {translate('Heading.AddPlace')}
        </Typography>
      </Grid>
      <PlacesManagementGridContainer
        creatorTargetId={gameDetails?.creator?.id ?? 0}
        creatorTargetType={getCreatorTargeType}
        creationContext={CreationContextType.NonGameCreation}
        universeId={gameDetails?.id ?? 0}
        startIndex={1}
        maxRows={5}
        enableGetOwnedPlacesByContextV2
      />
    </Grid>
  );
};

export default withTranslation(PlacesManagementContainer, [
  TranslationNamespace.Error,
  TranslationNamespace.Places,
  TranslationNamespace.Creations,
]);
