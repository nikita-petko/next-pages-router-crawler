import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid, Typography, useMediaQuery } from '@rbx/ui';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BreadcrumbItemType from '@modules/navigation/layout/enums/BreadcrumbsItemType';
import useBreadcrumbRegistration from '@modules/navigation/layout/hooks/useBreadcrumbRegistration';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useOverviewStyles from '../../common/components/Overview.styles';
import { useCurrentEnvironment } from '../EnvironmentProvider';
import ConfigureEnvironmentForm from './ConfigureEnvironmentForm';

const ConfigureEnvironmentContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const { translate } = useTranslation();
  const { canConfigure } = useCurrentGame();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const { data: environment, isLoading, error, refetch } = useCurrentEnvironment();

  useBreadcrumbRegistration(BreadcrumbItemType.Environments, environment?.slug ?? undefined);

  const handleReload = useCallback(() => {
    void refetch();
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
