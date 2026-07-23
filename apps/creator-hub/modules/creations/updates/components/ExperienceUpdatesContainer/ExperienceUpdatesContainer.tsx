import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Alert, AlertTitle, CircularProgress, Grid, Link, Typography } from '@rbx/ui';
import { FailureView } from '@modules/miscellaneous/common/components/FailureView';
import { EmptyGrid } from '@modules/miscellaneous/common/components/EmptyGrid';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { StatusCodes } from '@rbx/core';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useRouter } from 'next/router';
import gameUpdateNotificationsClient, {
  GameUpdateMessageModel,
} from '@modules/clients/gameUpdateNotifications';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import useExperienceUpdatesContainerStyles from './ExperienceUpdatesContainer.styles';
import ExperienceUpdatesStepNavigation from '../ExperienceUpdatesStepNavigation/ExperienceUpdatesStepNavigation';

const ExperienceUpdatesContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
    return undefined;
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

  const {
    params: { enableIAM2 },
  } = useIXPParameters(IXPLayers.CreatorHubNavigationUser);

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
          {!enableIAM2 && (
            <Typography variant='h1' component='h1'>
              {translate('Heading.Updates')}
            </Typography>
          )}
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
