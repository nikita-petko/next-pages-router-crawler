import type { FC } from 'react';
import { useMemo } from 'react';
import { numberFormatter } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Grid, Link, PeopleIcon, ThumbUpIcon, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAudienceReachData } from '@modules/audience-reach/hooks/useAudienceReachData';
import { ReachLevel } from '@modules/audience-reach/types/audienceReach';
import type { GameDetailResponse } from '@modules/clients/games';
import { Audience } from '@modules/creations/common/audiences';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useGetUniverseConfiguration } from '@modules/react-query/develop';
import useOverviewVariant, { OverviewVariant } from '../hooks/useOverviewVariant';
import useUniverseVotes from '../hooks/useUniverseVotes';
import useOverviewHeaderStyles from './OverviewHeader.styles';

type OverviewHeaderInfoSectionProps = {
  universeDetails: GameDetailResponse;
  enableAudienceReachOnOverviewPage: boolean;
};

const INVALID_LIKE_RATIO_PLACEHOLDER = '--';

const OverviewHeaderInfoSection: FC<OverviewHeaderInfoSectionProps> = ({
  universeDetails,
  enableAudienceReachOnOverviewPage,
}) => {
  const { translate: RAQITranslate } = useRAQIV2TranslationDependencies();
  const { translate } = useTranslation();
  const { classes: styles } = useOverviewHeaderStyles();
  const { state: audienceReachState } = useAudienceReachData(universeDetails.id ?? 0);
  const { data, isLoading: isUniverseConfigLoading } = useGetUniverseConfiguration(
    universeDetails.id,
  );
  const audiences = data?.audiences;
  const isPublic = audiences?.includes(Audience.Public) ?? false;
  const isEditorsOnly = audiences?.length === 1 && audiences[0] === Audience.Editors;
  const { variant } = useOverviewVariant(universeDetails.id ?? 0);
  const showInsightsV2Overview = variant === OverviewVariant.Insights;
  const { canConfigure, isLoadingGame } = useCurrentGame();

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

  const title = useMemo(() => {
    return universeDetails.name ? (
      <Typography variant='h1'>{universeDetails.name}</Typography>
    ) : null;
  }, [universeDetails.name]);

  const subtitle = useMemo(() => {
    return universeDetails.updated ? (
      <Typography
        variant='body1'
        color={enableAudienceReachOnOverviewPage ? 'secondary' : 'primary'}>
        {translate('Label.DateUpdated', { date: universeDetails.updated.toLocaleString() })}
      </Typography>
    ) : null;
  }, [universeDetails.updated, enableAudienceReachOnOverviewPage, translate]);

  const access = useMemo(() => {
    let accessLabel = '';
    if (!isUniverseConfigLoading) {
      if (isPublic) {
        accessLabel = translate('Label.Public');
      } else if (isEditorsOnly) {
        accessLabel = translate('Label.Private');
      } else {
        accessLabel = translate('Label.Limited');
      }
    }

    return (
      <Typography variant='body1' color='secondary'>
        {translate('Label.AccessLevel')}{' '}
        <Link
          color='inherit'
          underline='always'
          href={`/dashboard/creations/experiences/${universeDetails?.id}/configure`}>
          {accessLabel}
        </Link>
      </Typography>
    );
  }, [translate, universeDetails, isEditorsOnly, isPublic, isUniverseConfigLoading]);

  const audienceReach = useMemo(() => {
    let reachLabel = '';
    if (isEditorsOnly) {
      reachLabel = translate('Label.Private');
    } else if (audienceReachState) {
      switch (audienceReachState?.reachLevel) {
        case ReachLevel.AllAges:
          reachLabel = translate('Label.AllAges');
          break;
        case ReachLevel.Ages9Plus:
          reachLabel = translate('Label.Ages9Plus');
          break;
        case ReachLevel.Ages16Plus:
          reachLabel = translate('Label.Ages16Plus');
          break;
        case ReachLevel.Ages16PlusAndTrustedFriends:
          reachLabel = translate('Label.Ages16PlusAndTrustedFriends');
          break;
        case ReachLevel.PersonalUse:
          reachLabel = translate('Label.PersonalUse');
          break;
      }
    }
    return (
      <Typography variant='body1' color='secondary'>
        {translate('Label.AudienceReachLevel')}{' '}
        <Link
          color='inherit'
          underline='always'
          href={`/dashboard/creations/experiences/${universeDetails?.id}/audience-reach`}>
          {reachLabel}
        </Link>
      </Typography>
    );
  }, [translate, universeDetails, audienceReachState, isEditorsOnly]);

  const stats = [
    {
      key: 'ratio',
      Icon: ThumbUpIcon,
      content: likeRatio,
    },
    { key: 'playing', Icon: PeopleIcon, content: universeDetails.playing?.toLocaleString() ?? 0 },
    {
      key: 'visited',
      content: `${universeDetails.visits?.toLocaleString() ?? 0} ${RAQITranslate(
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

  if (showInsightsV2Overview) {
    return (
      <Grid item className={styles.titleContainer}>
        {title}
        {enableAudienceReachOnOverviewPage && (
          <>
            <Grid item className={styles.subtitleContainer} marginTop='12px'>
              {access}
            </Grid>
            {canConfigure && !isLoadingGame && (
              <Grid item className={styles.subtitleContainer}>
                {audienceReach}
              </Grid>
            )}
          </>
        )}
      </Grid>
    );
  }

  return (
    <Grid item direction='column' width='100%'>
      <Grid item className={styles.titleContainer}>
        {title}
      </Grid>
      {enableAudienceReachOnOverviewPage && (
        <>
          <Grid item className={styles.subtitleContainer} marginTop='12px'>
            {access}
          </Grid>
          {canConfigure && !isLoadingGame && (
            <Grid item className={styles.subtitleContainer}>
              {audienceReach}
            </Grid>
          )}
        </>
      )}
      <Grid item className={styles.subtitleContainer}>
        {subtitle}
      </Grid>
      <Grid item container spacing={2}>
        {stats}
      </Grid>
    </Grid>
  );
};

export default OverviewHeaderInfoSection;
