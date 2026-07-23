import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { CreatorType, EmptyGrid } from '@modules/miscellaneous/common';
import { CircularProgress, Grid, Typography, useMediaQuery } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import CreationContextType from '../../common/enums/CreationContextType';
import PlacesManagementGridContainer from './PlacesManagementGridContainer';

const PlacesManagementContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
