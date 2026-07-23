import type { FunctionComponent } from 'react';
import React from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Typography, Grid, useMediaQuery, useTheme } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useActivityFeedStyles from '../components/ActivityFeed.styles';
import ActivityFeedGridContainer from './ActivityFeedGridContainer';

const ActivityFeedContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const { gameDetails, canConfigure } = useCurrentGame();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('Medium'));

  const {
    classes: { section },
  } = useActivityFeedStyles();

  if (canConfigure === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }
  return (
    <section className={section}>
      <Grid container>
        {typeof gameDetails === 'undefined' ||
        gameDetails === null ||
        typeof gameDetails.id === 'undefined' ? (
          <EmptyGrid>
            {gameDetails === null ? (
              <Typography color='secondary' align='center'>
                {translate('Message.UnableToLoadGame')}
              </Typography>
            ) : (
              <CircularProgress />
            )}
          </EmptyGrid>
        ) : (
          <ActivityFeedGridContainer isSmallScreen={isSmallScreen} universeId={gameDetails.id} />
        )}
      </Grid>
    </section>
  );
};

export default withTranslation(ActivityFeedContainer, [
  TranslationNamespace.ActivityFeed,
  TranslationNamespace.Access,
  TranslationNamespace.Error,
]);
