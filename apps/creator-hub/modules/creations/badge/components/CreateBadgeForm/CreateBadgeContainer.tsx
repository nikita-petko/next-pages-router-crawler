import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { Grid, CircularProgress } from '@rbx/ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { ErrorPage } from '@modules/miscellaneous/error';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { badgesClient, GetBadgesMetadataResponse } from '@modules/clients';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import useCreateBadgeFormStyles from './CreateBadgeForm.styles';
import CreateBadgeForm from './CreateBadgeForm';

const CreateBadgeContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { pageContainer },
  } = useCreateBadgeFormStyles();
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const { canConfigure, isLoadingGame, gameDetails } = useCurrentGame();

  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isInitializationFailed, setIsInitializationFailed] = useState<boolean>(false);
  const [hasFreeQuota, setHasFreeQuota] = useState<boolean>(true);
  const [badgeMetadata, setBadgeMetadata] = useState<GetBadgesMetadataResponse | null>(null);

  const loadBadgeMetadata = useCallback(
    async (universeId: number) => {
      setIsInitializing(true);
      try {
        const [quota, metaData] = await Promise.all([
          badgesClient.getFreeBadgesQuota(universeId),
          badgesClient.getBadgesMetadata(),
        ]);
        setHasFreeQuota(quota > 0);
        setBadgeMetadata(metaData);
        return quota > 0;
      } catch (e) {
        if (typeof e === 'string') {
          error(e);
        }
        setIsInitializationFailed(true);
        return false;
      } finally {
        setIsInitializing(false);
      }
    },
    [error],
  );

  const loadPage = useCallback(() => {
    if (!isLoadingGame && gameDetails && gameDetails.id) {
      loadBadgeMetadata(gameDetails.id);
    }
  }, [isLoadingGame, gameDetails, loadBadgeMetadata]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  if (isInitializing) {
    return (
      <Grid container justifyContent='center' alignItems='center' className={pageContainer}>
        <CircularProgress />
      </Grid>
    );
  }

  if (canConfigure !== true) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (isInitializationFailed || !badgeMetadata) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={loadPage}
      />
    );
  }

  return <CreateBadgeForm hasFreeQuota={hasFreeQuota} badgeMetadata={badgeMetadata} />;
};

export default withTranslation(CreateBadgeContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Badges,
  TranslationNamespace.Error,
]);
