import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  Typography,
  Grid,
  ListItemText,
  Avatar,
  Link,
  ImageIcon,
  TableRow,
  TableCell,
  RobuxIcon,
} from '@rbx/ui';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { ActivityFeedItemInfo } from '../hooks/useActivityFeedItemInfo';

import useActivityFeedItemStyles from './ActivityFeedItem.styles';
import ActivityFeedItemCardContainer from './ActivityFeedItemCardContainer';
import { EventType, ResourceType } from '../enums/ActivityFeedEnums';

interface ActivityFeedItemProps {
  activityFeedItemInfo: ActivityFeedItemInfo;
  isSmallScreen: boolean;
  includeLocation: boolean;
}

const ActivityFeedItem: FunctionComponent<React.PropsWithChildren<ActivityFeedItemProps>> = ({
  activityFeedItemInfo,
  isSmallScreen,
  includeLocation,
}) => {
  const {
    classes: {
      thumbnail,
      avatar,
      itemRow,
      bulletSymbol,
      fullScreenTruncateStyles,
      truncateContainer,
      translationStringStyles,
      cellPadding,
      settingsLinkCell,
      smallScreenTruncateUserName,
      smallScreenTruncateLocation,
    },
  } = useActivityFeedItemStyles();
  const [icon, setIcon] = useState<React.JSX.Element | null>(null);

  const renderIcon = useCallback(
    (
      type: ThumbnailTypes,
      targetId: number,
      altText: string,
      variant: 'circular' | 'rounded' | 'square' | undefined,
    ) => {
      return (
        <Link
          href={activityFeedItemInfo.thumbnailLink}
          target='_blank'
          onClick={() =>
            // Log click event when clicking on the event icon
            unifiedLoggerClient.logClickEvent({
              eventName: 'clickActivityFeedEvent.icon',
              parameters: {
                eventType: EventType[activityFeedItemInfo.filters.eventType],
              },
            })
          }>
          <Avatar variant={variant} alt={altText} className={`${thumbnail} ${avatar}`}>
            <Thumbnail2d
              type={type}
              targetId={targetId}
              includeBackground
              alt={altText}
              isPendingNewTarget={false}
            />
          </Avatar>
        </Link>
      );
    },
    [activityFeedItemInfo.filters.eventType, activityFeedItemInfo.thumbnailLink, avatar, thumbnail],
  );
  useEffect(() => {
    switch (activityFeedItemInfo.iconType) {
      case ResourceType.Universe:
      case ResourceType.Place:
        setIcon(
          renderIcon(
            ThumbnailTypes.placeIcon,
            activityFeedItemInfo.iconId,
            'Place Icon',
            'rounded',
          ),
        );
        break;
      case ResourceType.User:
        setIcon(
          renderIcon(
            ThumbnailTypes.avatarHeadshot,
            activityFeedItemInfo.iconId,
            'User Icon',
            'circular',
          ),
        );
        break;
      case ResourceType.Badge:
        setIcon(
          renderIcon(
            ThumbnailTypes.badgeIcon,
            activityFeedItemInfo.iconId,
            'Badge Icon',
            'circular',
          ),
        );
        break;
      case ResourceType.DeveloperProduct:
        setIcon(
          renderIcon(
            ThumbnailTypes.developerProductIcon,
            activityFeedItemInfo.iconId,
            'Badge Icon',
            'circular',
          ),
        );
        break;
      case ResourceType.GamePass:
        setIcon(
          renderIcon(
            ThumbnailTypes.gamePassIcon,
            activityFeedItemInfo.iconId,
            'Badge Icon',
            'circular',
          ),
        );
        break;
      case ResourceType.Group:
        setIcon(
          renderIcon(
            ThumbnailTypes.groupIcon,
            activityFeedItemInfo.iconId,
            'Group Icon',
            'circular',
          ),
        );
        break;
      case ResourceType.Asset:
        setIcon(
          renderIcon(
            ThumbnailTypes.assetThumbnail,
            activityFeedItemInfo.iconId,
            'Asset',
            'circular',
          ),
        );
        break;
      case ResourceType.Robux:
        setIcon(
          <Avatar variant='circular' alt='Robux Icon' className={thumbnail}>
            <RobuxIcon fontSize='large' />
          </Avatar>,
        );
        break;
      default:
        setIcon(<ImageIcon />);
    }
  }, [activityFeedItemInfo.iconType, activityFeedItemInfo.iconId, renderIcon, thumbnail]);

  const smallScreen = (
    <TableRow className={itemRow} data-testid={`activity-feed-item-${activityFeedItemInfo.id}`}>
      <TableCell>
        <Grid container item direction='row' alignItems='center' wrap='nowrap'>
          <Grid item alignSelf='flex-start' paddingTop='1em'>
            {icon}
          </Grid>
          <Grid item direction='column' alignItems='center' width='100%'>
            <ListItemText
              primary={
                <Grid container alignItems='center' wrap='nowrap' justifyContent='space-between'>
                  <Typography variant='overline' color='secondary'>
                    {activityFeedItemInfo.dateTime}
                  </Typography>
                  <Grid alignItems='flex-end' justifyContent='flex-end'>
                    {(activityFeedItemInfo.viewBasicSettingsLink ||
                      activityFeedItemInfo.viewOnRobloxLink) && (
                      <ActivityFeedItemCardContainer activityFeedItemInfo={activityFeedItemInfo} />
                    )}
                  </Grid>
                </Grid>
              }
              secondary={
                <Typography variant='body1' color='primary' className={translationStringStyles}>
                  {activityFeedItemInfo.translationString}
                </Typography>
              }
            />
            <Grid
              item
              direction='row'
              display='inline-flex'
              alignItems='center'
              wrap='nowrap'
              maxWidth='100%'>
              <Grid item alignItems='center'>
                {activityFeedItemInfo.changedByLink ? (
                  <Link href={activityFeedItemInfo.changedByLink} target='_blank'>
                    <Typography className={smallScreenTruncateUserName}>
                      {`@${activityFeedItemInfo.username}`}
                    </Typography>
                  </Link>
                ) : (
                  <Typography className={smallScreenTruncateUserName}>
                    {`@${activityFeedItemInfo.username}`}
                  </Typography>
                )}
                {includeLocation && activityFeedItemInfo.iconType === ResourceType.Place && (
                  <Typography className={bulletSymbol}>•</Typography>
                )}
              </Grid>

              {includeLocation && activityFeedItemInfo.iconType === ResourceType.Place && (
                <div>
                  <Link
                    href={activityFeedItemInfo.locationLink}
                    target='_blank'
                    className={smallScreenTruncateLocation}>
                    <Typography>{activityFeedItemInfo.location}</Typography>
                  </Link>
                </div>
              )}
            </Grid>
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );

  const fullScreen = (
    <TableRow className={itemRow} data-testid={`activity-feed-item-${activityFeedItemInfo.id}`}>
      <TableCell className={cellPadding}>
        <Grid container alignItems='center'>
          <Grid item>{icon}</Grid>
          <Grid item XSmall>
            <ListItemText
              primary={
                <Typography variant='overline' color='secondary'>
                  {activityFeedItemInfo.dateTime}
                </Typography>
              }
              secondary={
                <Typography variant='body1' color='primary' className={translationStringStyles}>
                  {activityFeedItemInfo.translationString}
                </Typography>
              }
            />
          </Grid>
        </Grid>
      </TableCell>
      <TableCell className={`${truncateContainer} ${cellPadding}`}>
        {activityFeedItemInfo.changedByLink ? (
          <Link
            href={activityFeedItemInfo.changedByLink}
            onClick={() =>
              unifiedLoggerClient.logClickEvent({
                eventName: 'clickActivityFeedEvent.changedBy',
                parameters: {
                  eventType: EventType[activityFeedItemInfo.filters.eventType],
                },
              })
            }
            className={truncateContainer}
            target='_blank'>
            <Typography className={fullScreenTruncateStyles}>
              {`@${activityFeedItemInfo.username}`}
            </Typography>
          </Link>
        ) : (
          <Typography className={smallScreenTruncateUserName}>
            {`@${activityFeedItemInfo.username}`}
          </Typography>
        )}
      </TableCell>
      {includeLocation && (
        <TableCell className={`${truncateContainer} ${cellPadding}`}>
          <Link
            href={activityFeedItemInfo.locationLink}
            onClick={() =>
              // Log click event for "Location" button
              unifiedLoggerClient.logClickEvent({
                eventName: 'clickActivityFeedEvent.location',
                parameters: {
                  eventType: EventType[activityFeedItemInfo.filters.eventType],
                },
              })
            }
            className={truncateContainer}
            target='_blank'>
            <Typography className={fullScreenTruncateStyles}>
              {activityFeedItemInfo.location}
            </Typography>
          </Link>
        </TableCell>
      )}
      <TableCell className={settingsLinkCell} align='right'>
        {(activityFeedItemInfo.viewBasicSettingsLink || activityFeedItemInfo.viewOnRobloxLink) && (
          <ActivityFeedItemCardContainer activityFeedItemInfo={activityFeedItemInfo} />
        )}
      </TableCell>
    </TableRow>
  );
  return isSmallScreen ? smallScreen : fullScreen;
};

export default ActivityFeedItem;
