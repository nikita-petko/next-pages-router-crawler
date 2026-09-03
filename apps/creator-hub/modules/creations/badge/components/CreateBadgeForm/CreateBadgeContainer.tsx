import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Grid, CircularProgress } from '@rbx/ui';
import { isBadgeDefaultIconEnabled } from '@generated/flags/creatorCreations';
import type { GetBadgesMetadataResponse } from '@modules/clients/badges';
import badgesClient from '@modules/clients/badges';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import CreateBadgeForm from './CreateBadgeForm';
import useCreateBadgeFormStyles from './CreateBadgeForm.styles';

const CreateBadgeContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { pageContainer },
  } = useCreateBadgeFormStyles();
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const { canConfigure, isLoadingGame, gameDetails } = useCurrentGame();
  const { ready: isFlagReady, value: isDefaultBadgeIconEnabled } =
    useFlag(isBadgeDefaultIconEnabled);

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
      void loadBadgeMetadata(gameDetails.id);
    }
  }, [isLoadingGame, gameDetails, loadBadgeMetadata]);

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- initial metadata load is intentionally effect-driven; setState happens in the async loadBadgeMetadata call
    loadPage();
  }, [loadPage]);

  if (isInitializing || !isFlagReady) {
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

  return (
    <CreateBadgeForm
      hasFreeQuota={hasFreeQuota}
      badgeMetadata={badgeMetadata}
      defaultBadgeIconImageId={badgeMetadata.defaultBadgeIconImageId}
      isDefaultBadgeIconEnabled={isDefaultBadgeIconEnabled ?? false}
    />
  );
};

export default withTranslation(CreateBadgeContainer, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Badges,
  TranslationNamespace.Error,
]);
