import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, AlertTitle, CircularProgress, Grid, Link } from '@rbx/ui';
import type { GameUpdateMessageModel } from '@modules/clients/gameUpdateNotifications';
import gameUpdateNotificationsClient from '@modules/clients/gameUpdateNotifications';
import { EmptyGrid } from '@modules/miscellaneous/components/EmptyGrid';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ExperienceUpdatesStepNavigation from '../ExperienceUpdatesStepNavigation/ExperienceUpdatesStepNavigation';
import useExperienceUpdatesContainerStyles from './ExperienceUpdatesContainer.styles';

const ExperienceUpdatesContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const {
    classes: { experienceUpdateContainer },
  } = useExperienceUpdatesContainerStyles();
  const { gameDetails, isLoadingGame, canConfigure, refreshGameDetails } = useCurrentGame();
  const { translate, translateHTML } = useTranslation();
  const [isGetExperienceUpdatesListFailed, setIsGetExperienceUpdatesListFailed] =
    useState<boolean>(false);
  const [experienceUpdatesList, setExperienceUpdatesList] = useState<
    GameUpdateMessageModel[] | null
  >(null);
  const router = useRouter();
  const universeId = useMemo(() => {
    const { id } = router.query;
    if (id) {
      const parsedId = parseInt(id as string, 10);
      if (parsedId > 0) {
        return parsedId;
      }
    }
    return;
  }, [router.query]);

  const getExperienceUpdatesList = useCallback(async (id: number) => {
    setIsGetExperienceUpdatesListFailed(false);
    try {
      const response = await gameUpdateNotificationsClient.getGameUpdateNotifications({
        universeId: id,
      });
      setExperienceUpdatesList(response);
    } catch {
      setIsGetExperienceUpdatesListFailed(true);
    }
  }, []);

  const updateExperienceUpdatesList = useCallback((newUpdates: GameUpdateMessageModel) => {
    setExperienceUpdatesList((prevList) => (prevList ? [newUpdates, ...prevList] : [newUpdates]));
  }, []);

  const handlePageReload = useCallback(() => {
    if (universeId) {
      if (!gameDetails) {
        refreshGameDetails();
      }
      if (isGetExperienceUpdatesListFailed) {
        getExperienceUpdatesList(universeId);
      }
    }
  }, [
    gameDetails,
    isGetExperienceUpdatesListFailed,
    getExperienceUpdatesList,
    refreshGameDetails,
    universeId,
  ]);

  useEffect(() => {
    if (universeId) {
      getExperienceUpdatesList(universeId);
    }
  }, [universeId, getExperienceUpdatesList]);

  if (!isLoadingGame && !canConfigure) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  if ((!isLoadingGame && !gameDetails) || isGetExperienceUpdatesListFailed) {
    return (
      <FailureView
        title={translate('Heading.FailedToLoadPage')}
        message={translate('Message.FailedToLoadPage')}
        buttonText={translate('Action.FailedToLoadPage')}
        onReload={handlePageReload}
      />
    );
  }

  if (gameDetails?.name && gameDetails?.id && experienceUpdatesList) {
    return (
      <Grid container classes={{ root: experienceUpdateContainer }}>
        <Grid item XSmall={12}>
          <Grid marginBottom='36px'>
            <Alert severity='info' variant='outlined'>
              <AlertTitle>{translate('Message.EEUpdatesWillMove')}</AlertTitle>
              {translateHTML('Message.EEUpdatesMergeBanner', [
                {
                  opening: 'eventsLinkStart',
                  closing: 'eventsLinkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={`/dashboard/creations/experiences/${universeId}/events`}
                        target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Alert>
          </Grid>
        </Grid>
        <Grid item XSmall={12}>
          <ExperienceUpdatesStepNavigation
            experienceName={gameDetails.name}
            experienceId={gameDetails.id}
            experienceUpdatesList={experienceUpdatesList}
            onExperienceUpdatesListChange={updateExperienceUpdatesList}
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <EmptyGrid>
      <CircularProgress />
    </EmptyGrid>
  );
};

export default withTranslation(ExperienceUpdatesContainer, [
  TranslationNamespace.Updates,
  TranslationNamespace.Error,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Creations,
]);
