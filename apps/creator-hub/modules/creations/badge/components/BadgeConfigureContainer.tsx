import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { badgesClient, GetBadgesMetadataResponse } from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useOverviewStyles } from '../../common';
import BadgeConfigureForm from './ConfigureBadgeForm/ConfigureBadgeForm';
import useCurrentBadge from '../hooks/useCurrentBadge';

const BadgeConfigureContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { emptyGrid },
  } = useOverviewStyles();
  const { badgeDetails, isBadgeLoading } = useCurrentBadge();
  const { error } = useMetricsMonitoring();
  const { canConfigure } = useCurrentGame();
  const [badgeMetadata, setBadgeMetadata] = useState<GetBadgesMetadataResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const { translate } = useTranslation();
  const router = useRouter();

  const loadBadgeMetadata = useCallback(async () => {
    setIsInitializing(true);
    try {
      const metaData = await badgesClient.getBadgesMetadata();
      setBadgeMetadata(metaData);
    } catch (e) {
      if (typeof e === 'string') {
        error(e);
      }
    } finally {
      setIsInitializing(false);
    }
  }, [error, setBadgeMetadata]);

  const handleReload = useCallback(() => {
    router.reload();
  }, [router]);

  useEffect(() => {
    loadBadgeMetadata();
  }, [loadBadgeMetadata]);

  if (isBadgeLoading || isInitializing) {
    return (
      <Grid container className={emptyGrid} justifyContent='center' alignItems='center'>
        <CircularProgress />
      </Grid>
    );
  }

  if (canConfigure !== true) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!badgeDetails || !badgeMetadata) {
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
    <Grid container justifyContent='space-between' alignItems='center'>
      <BadgeConfigureForm badgeDetails={badgeDetails} badgeMetadata={badgeMetadata} />
    </Grid>
  );
};

export default withTranslation(BadgeConfigureContainer, [
  TranslationNamespace.Creations,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Badges,
]);
