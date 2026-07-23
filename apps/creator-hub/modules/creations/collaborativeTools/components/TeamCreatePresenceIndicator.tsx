import React, { FunctionComponent, useCallback } from 'react';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, Card, Grid, Typography, Tooltip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { ActiveUser } from '@modules/clients/teamCreatePresence';
import useTeamCreatePresenceIndicatorStyles from './TeamCreatePresenceIndicator.styles';
import {
  maxActiveUsers,
  displayAvatarCount,
  displayAvatarLimitPreOverflow,
} from '../constants/activeUserConstants';

export type TeamCreatePresenceIndicatorProps = {
  activeUsers?: ActiveUser[];
  width: number;
  isLoading: boolean;
};

const TeamCreatePresenceIndicator: FunctionComponent<
  React.PropsWithChildren<TeamCreatePresenceIndicatorProps>
> = ({ activeUsers, width, isLoading }) => {
  const {
    classes: {
      presenceIndicator,
      indicatorIcon,
      indicatorIconAnimation,
      avatarTooltip,
      activeUserIcon,
      activeUserOverflow,
      activeUserIconsContainer,
    },
  } = useTeamCreatePresenceIndicatorStyles();
  const { translate } = useTranslation();

  if (isLoading || !activeUsers || activeUsers.length === 0) {
    return null;
  }

  return (
    <Card
      className={presenceIndicator}
      data-testid='tc-presence-indicator'
      style={{ transform: `scale(${width / 200})` }}>
      <Grid
        item
        className={indicatorIcon}
        style={{ marginRight: activeUsers.length <= displayAvatarCount ? 2 : 9 }}>
        <Grid item className={indicatorIconAnimation} />
      </Grid>
      <Grid item className={activeUserIconsContainer}>
        {activeUsers
          .slice(
            0,
            activeUsers.length === displayAvatarLimitPreOverflow
              ? displayAvatarLimitPreOverflow
              : Math.min(activeUsers.length, displayAvatarCount),
          )
          .map(({ id, name }, index) => (
            <Tooltip key={id} title={name || ''} classes={{ tooltip: avatarTooltip }} arrow>
              <Avatar
                className={activeUserIcon}
                style={{ marginLeft: activeUsers.length > displayAvatarCount ? -2 : 5 }}
                variant='circular'
                data-testid='tc-presence-avatar'
                alt={name ?? ''}>
                <Thumbnail2d
                  targetId={id ?? 0}
                  type={ThumbnailTypes.avatarHeadshot}
                  alt={name ?? ''}
                />
              </Avatar>
            </Tooltip>
          ))}
        {activeUsers.length > displayAvatarLimitPreOverflow && (
          <Tooltip
            title={translate('Tooltip.MultipleUsers')}
            classes={{ tooltip: avatarTooltip }}
            arrow>
            <Card className={activeUserOverflow} data-testid='tc-presence-overflow'>
              <Typography align='center' style={{ fontSize: 10 }} variant='body1'>
                {Math.min(activeUsers.length, maxActiveUsers - 1) - displayAvatarCount}
                {activeUsers.length >= maxActiveUsers && '+'}
              </Typography>
            </Card>
          </Tooltip>
        )}
      </Grid>
    </Card>
  );
};

export default TeamCreatePresenceIndicator;
