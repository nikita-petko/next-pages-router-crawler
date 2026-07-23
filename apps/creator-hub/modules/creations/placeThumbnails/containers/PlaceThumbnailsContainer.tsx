import React, { FC, useCallback, useMemo, useState } from 'react';
import { CircularProgress, Grid, makeStyles, Tab, Tabs, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useAuthentication } from '@modules/authentication/providers';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes } from '@rbx/core';
import { EmptyGrid } from '@modules/miscellaneous/common';
import { FileUploaderProvider } from '@modules/thumbnail/context/FileUploaderProvider';
import ThumbnailsHomePageTabContent from '@modules/thumbnail/ThumbnailsHomePageTabContent';
import useCurrentPlace from '../../places/hooks/useCurrentPlace';
import ExperienceDetailPageTabContent from './ExperienceDetailPageTabContent';

const useStyles = makeStyles()((theme) => {
  return {
    sidePadding: {
      [theme.breakpoints.down('Medium')]: {
        padding: theme.spacing(0, 2, 2),
      },
    },
    tabsContainer: {
      borderBottom: `1px solid ${theme.palette.components.divider}`,
    },
  };
});

enum TabIndex {
  HomePage = 0,
  ExperienceDetailsPage = 1,
}

const PlaceThumbnailsContainer: FC = () => {
  const {
    classes: { sidePadding, tabsContainer },
  } = useStyles();
  const { translate } = useTranslation();
  const { isLoadingGame, gameDetails, canConfigure } = useCurrentGame();
  const universeId = gameDetails?.id;
  const { isPlaceLoading, placeDetails, canConfigurePlace } = useCurrentPlace();
  const placeId = placeDetails?.id;

  const { user } = useAuthentication();
  const userId = user?.id;

  const header = useMemo(() => {
    return (
      <Grid item XSmall={12} display='flex' flexDirection='column' marginBottom='36px'>
        <Typography variant='body1' color='secondary' marginTop='8px'>
          {translate('Description.Thumbnails.UploadThumbnails')}
        </Typography>
      </Grid>
    );
  }, [translate]);

  const [selectedTab, setSelectedTab] = useState<TabIndex>(TabIndex.HomePage);
  const selectTab = useCallback((_: React.SyntheticEvent, value: TabIndex) => {
    setSelectedTab(value);
  }, []);

  const tabs = useMemo(() => {
    return (
      <Tabs value={selectedTab} onChange={selectTab} classes={{ root: tabsContainer }}>
        <Tab label={translate('Label.Tab.HomePage')} value={TabIndex.HomePage} />
        <Tab
          label={translate('Label.Tab.ExperienceDetailPage')}
          value={TabIndex.ExperienceDetailsPage}
        />
      </Tabs>
    );
  }, [selectTab, selectedTab, tabsContainer, translate]);

  const activeTabContent = useMemo(() => {
    switch (selectedTab) {
      case TabIndex.HomePage:
        return universeId ? (
          <ThumbnailsHomePageTabContent universeId={universeId} canConfigure={!!canConfigure} />
        ) : null;
      case TabIndex.ExperienceDetailsPage:
        return userId && placeId ? (
          <ExperienceDetailPageTabContent
            userId={userId}
            placeId={placeId}
            universeId={universeId}
            canConfigurePlace={canConfigurePlace}
          />
        ) : null;
      default: {
        const exhaustiveCheck: never = selectedTab;
        throw new Error(`Unhandled tab index: ${exhaustiveCheck}`);
      }
    }
  }, [canConfigure, canConfigurePlace, placeId, selectedTab, universeId, userId]);

  if (isLoadingGame || isPlaceLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  if (!universeId || !placeId) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (!userId) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  // only display experience details page content if the place is not a root place
  if (gameDetails?.rootPlaceId !== placeId) {
    return (
      <FileUploaderProvider>
        <Grid container item display='flex' flexDirection='column' classes={{ root: sidePadding }}>
          {header}
          <ExperienceDetailPageTabContent
            userId={userId}
            placeId={placeId}
            universeId={universeId}
            canConfigurePlace={canConfigurePlace}
          />
        </Grid>
      </FileUploaderProvider>
    );
  }

  return (
    <FileUploaderProvider>
      <Grid container item display='flex' flexDirection='column' classes={{ root: sidePadding }}>
        {header}
        {tabs}
        {activeTabContent}
      </Grid>
    </FileUploaderProvider>
  );
};

export default withTranslation(PlaceThumbnailsContainer, [
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Error,
]);
