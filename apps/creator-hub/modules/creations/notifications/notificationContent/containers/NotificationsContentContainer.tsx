import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { EmptyGrid } from '@modules/miscellaneous/common/components/EmptyGrid';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import React, { FC, useCallback, useEffect } from 'react';
import useUniverseId from '../../hooks/useUniverseId';
import NotificationsContentEmptyView from '../components/NotificationsContentEmptyView';
import NotificationsContentList from '../components/NotificationsContentList';
import { useNotificationsContent } from '../provider/NotificationsContentProvider';

const NotificationsContentContainer: FC<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const {
    notificationsContentList,
    isNotificationContentLoading,
    isGetNotificationsContentListFailed,
    initializeNotificationsContentList,
  } = useNotificationsContent();
  const { gameDetails, isLoadingGame, canConfigure, refreshGameDetails } = useCurrentGame();

  const universeId = useUniverseId();

  useEffect(() => {
    if (universeId) {
      initializeNotificationsContentList(universeId);
    }
  }, [universeId, initializeNotificationsContentList]);

  const handlePageReload = useCallback(() => {
    if (universeId) {
      if (!gameDetails) {
        refreshGameDetails();
      }
      if (isGetNotificationsContentListFailed) {
        initializeNotificationsContentList(universeId);
      }
    }
  }, [
    universeId,
    gameDetails,
    isGetNotificationsContentListFailed,
    initializeNotificationsContentList,
    refreshGameDetails,
  ]);

  if (isLoadingGame || isNotificationContentLoading) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (!canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if (!gameDetails || isGetNotificationsContentListFailed) {
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
    <Grid item XSmall={12}>
      {notificationsContentList.length ? (
        <NotificationsContentList
          list={notificationsContentList}
          universeId={universeId as number}
        />
      ) : (
        <NotificationsContentEmptyView universeId={universeId as number} />
      )}
    </Grid>
  );
};

export default NotificationsContentContainer;
