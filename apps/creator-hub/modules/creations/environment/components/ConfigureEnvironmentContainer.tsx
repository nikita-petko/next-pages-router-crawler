import React, { FunctionComponent, useCallback } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography, useMediaQuery } from '@rbx/ui';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useOverviewStyles } from '../../common';
import ConfigureEnvironmentForm from './ConfigureEnvironmentForm';
import { useCurrentEnvironment } from '../EnvironmentProvider';

const ConfigureEnvironmentContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const { translate } = useTranslation();
  const { canConfigure } = useCurrentGame();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { data: environment, isLoading, error, refetch } = useCurrentEnvironment();

  const handleReload = useCallback(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <Grid container className={emptyGrid} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (canConfigure !== true) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!environment || error) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handleReload}
      />
    );
  }

  return (
    <Grid container direction='column'>
      <Grid container item>
        <Grid item XSmall={12}>
          <Typography variant={isCompactView ? 'h4' : 'h1'}>
            {translate('Heading.UpdateEnvironment')}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item>
        <ConfigureEnvironmentForm environment={environment} />
      </Grid>
    </Grid>
  );
};

export default withTranslation(ConfigureEnvironmentContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Environments,
]);
