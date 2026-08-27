import type { FunctionComponent } from 'react';
import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
} from '@rbx/foundation-ui';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
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
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { ResourceType } from '../enums/ActivityFeedEnums';
import type { ActivityFeedItemInfo } from '../hooks/useActivityFeedItemInfo';
import { getEventTypeName } from '../utils/eventTypeUtils';
import useActivityFeedItemStyles from './ActivityFeedItem.styles';
import ActivityFeedItemCardContainer from './ActivityFeedItemCardContainer';

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
  const hasDescriptionDetails = Boolean(activityFeedItemInfo.descriptionDetails?.length);
  const hasActivityFeedItemLinks = [
    activityFeedItemInfo.viewBasicSettingsLink,
    activityFeedItemInfo.viewOnRobloxLink,
  ].some((link) => Boolean(link));

  const renderIcon = (
    type: ThumbnailTypes,
    targetId: number,
    altText: string,
    variant: 'circular' | 'rounded' | 'square' | undefined,
  ) => (
    <Link
      href={activityFeedItemInfo.thumbnailLink}
      target='_blank'
      onClick={() =>
        // Log click event when clicking on the event icon
        unifiedLoggerClient.logClickEvent({
          eventName: 'clickActivityFeedEvent.icon',
          parameters: {
            eventType: getEventTypeName(activityFeedItemInfo.filters.eventType),
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

  const icon = (() => {
    switch (activityFeedItemInfo.iconType) {
      case ResourceType.Universe:
      case ResourceType.Place:
        return renderIcon(
          ThumbnailTypes.placeIcon,
          activityFeedItemInfo.iconId,
          'Place Icon',
          'rounded',
        );
      case ResourceType.User:
        return renderIcon(
          ThumbnailTypes.avatarHeadshot,
          activityFeedItemInfo.iconId,
          'User Icon',
          'circular',
        );
      case ResourceType.Badge:
        return renderIcon(
          ThumbnailTypes.badgeIcon,
          activityFeedItemInfo.iconId,
          'Badge Icon',
          'circular',
        );
      case ResourceType.DeveloperProduct:
        return renderIcon(
          ThumbnailTypes.developerProductIcon,
          activityFeedItemInfo.iconId,
          'Badge Icon',
          'circular',
        );
      case ResourceType.GamePass:
        return renderIcon(
          ThumbnailTypes.gamePassIcon,
          activityFeedItemInfo.iconId,
          'Badge Icon',
          'circular',
        );
      case ResourceType.Group:
        return renderIcon(
          ThumbnailTypes.groupIcon,
          activityFeedItemInfo.iconId,
          'Group Icon',
          'circular',
        );
      case ResourceType.Asset:
        return renderIcon(
          ThumbnailTypes.assetThumbnail,
          activityFeedItemInfo.iconId,
          'Asset',
          'circular',
        );
      case ResourceType.Robux:
        return (
          <Avatar variant='circular' alt='Robux Icon' className={thumbnail}>
            <RobuxIcon fontSize='large' />
          </Avatar>
        );
      default:
        return <ImageIcon />;
    }
  })();

  const description = hasDescriptionDetails ? (
    <Accordion size='Medium'>
      <AccordionItem>
        <AccordionItemTrigger className='text-align-x-left gap-small'>
          <span className='text-body-large content-emphasis text-wrap text-truncate-none no-clip'>
            {activityFeedItemInfo.translationString}
          </span>
        </AccordionItemTrigger>
        <AccordionItemContent className='text-wrap text-align-x-left no-clip-x'>
          <div className='flex flex-col gap-xxsmall padding-top-xxsmall'>
            {activityFeedItemInfo.descriptionDetails?.map((detail) => (
              <span key={detail} className='text-body-medium content-default'>
                {detail}
              </span>
            ))}
          </div>
        </AccordionItemContent>
      </AccordionItem>
    </Accordion>
  ) : (
    <Typography variant='body1' color='primary' className={translationStringStyles}>
      {activityFeedItemInfo.translationString}
    </Typography>
  );

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
                    {hasActivityFeedItemLinks && (
                      <ActivityFeedItemCardContainer activityFeedItemInfo={activityFeedItemInfo} />
                    )}
                  </Grid>
                </Grid>
              }
            />
            {description}
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
                      {activityFeedItemInfo.username}
                    </Typography>
                  </Link>
                ) : (
                  <Typography className={smallScreenTruncateUserName}>
                    {activityFeedItemInfo.username}
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
            />
            {description}
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
                  eventType: getEventTypeName(activityFeedItemInfo.filters.eventType),
                },
              })
            }
            className={truncateContainer}
            target='_blank'>
            <Typography className={fullScreenTruncateStyles}>
              {activityFeedItemInfo.username}
            </Typography>
          </Link>
        ) : (
          <Typography className={smallScreenTruncateUserName}>
            {activityFeedItemInfo.username}
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
                  eventType: getEventTypeName(activityFeedItemInfo.filters.eventType),
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
        {hasActivityFeedItemLinks && (
          <ActivityFeedItemCardContainer activityFeedItemInfo={activityFeedItemInfo} />
        )}
      </TableCell>
    </TableRow>
  );
  return isSmallScreen ? smallScreen : fullScreen;
};

export default ActivityFeedItem;
