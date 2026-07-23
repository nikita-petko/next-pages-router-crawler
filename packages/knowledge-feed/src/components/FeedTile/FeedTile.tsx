import React, { useRef } from 'react';
import { useLocalization, useTranslation } from '@rbx/intl';
import { Typography, Label, IconButton, PlayArrowIcon, Grid } from '@rbx/ui';
import type { UnifiedLogger } from '@rbx/unified-logger';
import { KnowledgeFeedEvent } from '../../constants/eventParams';
import useCardImpressionTracker from '../../hooks/useCardImpressionTracker';
import type { TTargetEnv, TFeedItemData, TBaseEventParams } from '../../types';
import { formatAuthorAvatarUrl, getThumbnailUrl } from '../../utilities/assetUtils';
import TileAvatar from '../Tile/TileAvatar';
import TileTimestamp from '../Tile/TileTimestamp';
import useFeedTileStyles from './FeedTile.style';

type TFeedTileProps = TFeedItemData & {
  targetEnv: TTargetEnv;
  onClick: () => void;
  tilePosition: number;
  unifiedLoggerClient: UnifiedLogger;
  eventParams: TBaseEventParams;
};

export default function FeedTile(props: TFeedTileProps) {
  const {
    title,
    titleKey,
    url,
    thumbnails,
    badge,
    duration,
    id,
    feedType,
    authorName,
    authorAvatarUrl,
    authorUserId,
    createdAtUtcTime,
    startedAtUtcTime,
    endedAtUtcTime,
    description,
    descriptionKey,
    tilePosition,
    targetEnv,
    onClick,
    unifiedLoggerClient,
    eventParams,
  } = props;
  const ref = useRef(null);
  const thumbnailSrc = thumbnails?.default?.url;
  useCardImpressionTracker(
    id,
    title,
    url,
    tilePosition,
    ref,
    KnowledgeFeedEvent.FeedCardImpression,
    unifiedLoggerClient,
    eventParams,
  );

  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const {
    classes: {
      root,
      thumbnail: thumbnailStyle,
      thumbnailContainer,
      durationLabel,
      badge: badgeStyle,
      title: titleStyle,
      description: descriptionStyle,
      avatar,
      avatarName,
    },
  } = useFeedTileStyles({ feedType });

  // when translation result is empty, fallback to original title/description
  const displayTitle = (titleKey && translate(titleKey)) || title;
  const displayDescription = (descriptionKey && translate(descriptionKey)) || description;
  return (
    <a ref={ref} href={url} target='_blank' rel='noreferrer' onClick={onClick} className={root}>
      <div className={thumbnailContainer} aria-label='thumbnail'>
        {thumbnailSrc && (
          <img
            className={thumbnailStyle}
            src={`${getThumbnailUrl(targetEnv, thumbnailSrc)}`}
            alt='thumbnail'
          />
        )}
        {feedType === 'YouTubeVideo' && (
          <>
            <IconButton
              size='small'
              color='onMediaLight'
              variant='contained'
              aria-label='play video'>
              <PlayArrowIcon />
            </IconButton>
            {duration && <Label classes={{ root: durationLabel }} labelText={duration} />}
          </>
        )}
      </div>
      {badge && <Label classes={{ root: badgeStyle }} labelText={badge} />}
      {displayTitle && (
        <Typography className={titleStyle} component='div' variant='h6' color='primary'>
          {displayTitle}
        </Typography>
      )}
      {createdAtUtcTime && (
        <TileTimestamp authoredUtcTime={createdAtUtcTime ?? ''} locale={locale} />
      )}
      {startedAtUtcTime && endedAtUtcTime && (
        <TileTimestamp range={[startedAtUtcTime, endedAtUtcTime]} locale={locale} />
      )}
      {displayDescription && (
        <Typography className={descriptionStyle} variant='body2' color='secondary'>
          {displayDescription}
        </Typography>
      )}
      {authorName && (
        <Grid container flexDirection='row' alignItems='center' classes={{ root: avatar }}>
          {authorAvatarUrl ? (
            <TileAvatar
              authorName={authorName ?? ''}
              authorAvatarUrl={formatAuthorAvatarUrl(targetEnv, authorAvatarUrl)}
              authorUserId={authorUserId ?? 0}
            />
          ) : null}
          <Typography
            className={avatarName}
            variant='body2'
            component='div'
            color={authorAvatarUrl || feedType === 'YouTubeVideo' ? 'primary' : 'secondary'}>
            {authorName}
          </Typography>
        </Grid>
      )}
    </a>
  );
}
