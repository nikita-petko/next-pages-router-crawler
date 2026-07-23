import React, { FC, useCallback, useMemo } from 'react';
import { Button, Grid, PeopleIcon, ThumbUpIcon, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { numberFormatter } from '@rbx/core';
import { GameDetailResponse } from '@modules/clients';
import { Item, uninitializedUniverseId, urls } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { translationKey } from '@modules/analytics-translations';
/* eslint-disable no-restricted-imports -- Items should be refactored out of creations */
import StatusCardContextMenu from '@modules/creations/common/components/StatusCardContextMenu';
import CopyTextActionMenuItem from '@modules/creations/common/components/CopyTextActionMenuItem';
import OpenLinkActionMenuItem from '@modules/creations/common/components/OpenLinkActionMenuItem';
/* eslint-enable no-restricted-imports -- Items should be refactored out of creations */
import {
  useRAQIV2TranslationDependencies,
  useShowInsightsOverviewV2,
} from '@modules/experience-analytics-shared';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import Router from 'next/router';
import {
  logEditDetailsClick,
  logEditInStudioClick,
  logViewOnRobloxClick,
} from '../utils/OverviewSummaryLogger';
import EditInStudioButton from './EditInStudioButton';
import UniverseOverviewThumbnail from './UniverseOverviewThumbnail';
import useOverviewHeaderStyles from './OverviewHeader.styles';
import useUniverseVotes from '../hooks/useUniverseVotes';

const { getUrlForItemType } = urls;
type OverviewHeaderProps = {
  universeDetails: GameDetailResponse;
};

const INVALID_LIKE_RATIO_PLACEHOLDER = '--';

const OverviewHeader: FC<OverviewHeaderProps> = ({ universeDetails }) => {
  const { translate: RQAItranslate } = useRAQIV2TranslationDependencies();
  const { translate } = useTranslation();
  const { classes: styles } = useOverviewHeaderStyles();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    params: { showEditInStudioButton },
  } = useIXPParameters(IXPLayers.CreatorHubNavigationUser);

  const showInsightsV2Overview = useShowInsightsOverviewV2();

  const {
    isLoading: isVoteLoading,
    isError: isVoteError,
    votes,
  } = useUniverseVotes(universeDetails.id ?? uninitializedUniverseId);
  const likeRatio = useMemo(() => {
    const totalVotes = votes.upVotes + votes.downVotes;
    if (isVoteLoading || isVoteError || totalVotes === 0) {
      return INVALID_LIKE_RATIO_PLACEHOLDER;
    }

    return numberFormatter(Math.floor((votes.upVotes / totalVotes) * 100) / 100, {
      style: 'percent',
      maximumFractionDigits: 0,
    });
  }, [isVoteLoading, isVoteError, votes]);

  const viewOnRoblox = useCallback(() => {
    const universeId = universeDetails?.id;
    const placeId = universeDetails?.rootPlaceId;
    if (universeId && placeId) {
      logViewOnRobloxClick(unifiedLogger, { universeId, placeId });
      const robloxUrl = getUrlForItemType(Item.Game, placeId);
      if (robloxUrl) {
        window.open(robloxUrl, '_blank');
      }
    }
  }, [unifiedLogger, universeDetails]);

  const logEditInStudio = useCallback(() => {
    const universeId = universeDetails?.id;
    const placeId = universeDetails?.rootPlaceId;
    if (universeId && placeId) {
      logEditInStudioClick(unifiedLogger, { universeId, placeId });
    }
  }, [unifiedLogger, universeDetails]);

  const editDetails = useCallback(() => {
    const universeId = universeDetails?.id;
    const placeId = universeDetails?.rootPlaceId;
    if (universeId && placeId) {
      logEditDetailsClick(unifiedLogger, { universeId, placeId });
      Router.push(dashboard.getConfigureExperienceUrl(universeId));
    }
  }, [unifiedLogger, universeDetails?.id, universeDetails?.rootPlaceId]);

  const thumbnail = universeDetails.id && universeDetails.name && universeDetails.rootPlaceId && (
    <UniverseOverviewThumbnail
      universeId={universeDetails.rootPlaceId}
      universeName={universeDetails.name}
    />
  );

  const title = useMemo(() => {
    return universeDetails.name ? (
      <Typography variant='h1'>{universeDetails.name}</Typography>
    ) : null;
  }, [universeDetails.name]);

  const subtitle = useMemo(() => {
    return universeDetails.updated ? (
      <Typography variant='body1'>Updated {universeDetails.updated.toLocaleString()}</Typography>
    ) : null;
  }, [universeDetails.updated]);

  const stats = [
    {
      key: 'ratio',
      Icon: ThumbUpIcon,
      content: likeRatio,
    },
    { key: 'playing', Icon: PeopleIcon, content: universeDetails.playing?.toLocaleString() ?? 0 },
    {
      key: 'visited',
      content: `${universeDetails.visits?.toLocaleString() ?? 0} ${RQAItranslate(
        translationKey('Heading.Visits', TranslationNamespace.Creations),
      )}`,
    },
  ].map(({ key, Icon, content }) => (
    <Grid key={key} item>
      {Icon && <Icon color='secondary' className={styles.statIcon} />}
      <Typography variant='body1' color='secondary' className={styles.stat}>
        {content}
      </Typography>
    </Grid>
  ));

  const body = useMemo(() => {
    if (showInsightsV2Overview) {
      return (
        <Grid item className={styles.titleContainer}>
          {title}
        </Grid>
      );
    }
    return (
      <Grid item container direction='column'>
        <Grid item className={styles.titleContainer}>
          {title}
        </Grid>
        <Grid item className={styles.subtitleContainer}>
          {subtitle}
        </Grid>
        <Grid item container spacing={2}>
          {stats}
        </Grid>
      </Grid>
    );
  }, [
    showInsightsV2Overview,
    stats,
    styles.subtitleContainer,
    styles.titleContainer,
    subtitle,
    title,
  ]);

  return (
    <Grid
      item
      container
      direction='row'
      className={showInsightsV2Overview ? undefined : styles.container}>
      <Grid
        item
        XSmall={4}
        className={
          showInsightsV2Overview ? styles.thumbnailContainerV2 : styles.thumbnailContainer
        }>
        {thumbnail}
      </Grid>
      <Grid
        item
        container
        direction='column'
        XSmall={12}
        Large={8}
        className={showInsightsV2Overview ? undefined : styles.metadataContainer}>
        {body}
        <Grid item alignItems='center' marginTop={showInsightsV2Overview ? '12px' : undefined}>
          {universeDetails.id && universeDetails.rootPlaceId && (
            <Grid container spacing={1}>
              <Grid item className={styles.editInStudioContainer}>
                <EditInStudioButton
                  size={showInsightsV2Overview ? 'medium' : 'large'}
                  universeId={universeDetails.id}
                  placeId={universeDetails.rootPlaceId}
                  onClick={logEditInStudio}
                />
              </Grid>
              <Grid item>
                {showEditInStudioButton ? (
                  <Button
                    size={showInsightsV2Overview ? 'medium' : 'large'}
                    color='primary'
                    variant='text'
                    onClick={editDetails}>
                    {translate('Action.EditDetails')}
                  </Button>
                ) : (
                  <Button
                    size={showInsightsV2Overview ? 'medium' : 'large'}
                    color='primary'
                    variant='text'
                    onClick={viewOnRoblox}>
                    {RQAItranslate(
                      translationKey('Label.ViewOnRoblox', TranslationNamespace.Creations),
                    )}
                  </Button>
                )}
              </Grid>
              {showEditInStudioButton && (
                <Grid item>
                  <StatusCardContextMenu
                    size='large'
                    menuItems={[
                      <OpenLinkActionMenuItem
                        key='view-on-roblox'
                        actionKey='viewOnRoblox'
                        url={getUrlForItemType(Item.Game, universeDetails?.rootPlaceId ?? 0) || ''}
                        actionName={translate('Action.OpenExperienceDetails')}
                      />,
                      <CopyTextActionMenuItem
                        actionName={translate('Action.CopyUniverseID')}
                        itemName={translate('Label.UniverseID')}
                        key='copy-universe-id'
                        actionKey='copyUniverseId'
                        textToCopy={universeDetails?.id?.toString()}
                      />,
                      <CopyTextActionMenuItem
                        actionName={translate('Action.CopyStartPlaceID')}
                        itemName={translate('Label.StartPlaceID')}
                        key='copy-start-place-id'
                        actionKey='copyPlaceId'
                        textToCopy={universeDetails?.rootPlaceId?.toString()}
                      />,
                      <CopyTextActionMenuItem
                        actionName={translate('Action.CopyURL')}
                        itemName={translate('Label.URL')}
                        key='copy-url'
                        actionKey='copyURL'
                        textToCopy={`${process.env.baseUrl}${dashboard.getExperienceOverviewUrl(universeDetails?.id ?? 0)}`}
                      />,
                    ]}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default withTranslation(OverviewHeader, [TranslationNamespace.Creations]);
