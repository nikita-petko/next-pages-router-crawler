import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, CircularProgress, Grid, Link, Typography } from '@rbx/ui';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { Collaborator, UseCollaboratorsResult } from '../hooks/useCollaborators';

export interface CollaboratorsListProps {
  data: UseCollaboratorsResult;
  universeId?: number;
}

const CollaboratorsList: FunctionComponent<CollaboratorsListProps> = ({ data, universeId }) => {
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { collaborators, friends, others, isLoading, error } = data;

  const handleProfileLinkClick = useCallback(
    (collaborator: Collaborator) => {
      unifiedLogger.logClickEvent({
        eventName: CreatorDashboardEventType.SafetyCollaboratorsClick,
        parameters: {
          view: 'nonOwner',
          action: 'viewCollaboratorProfile',
          collaboratorUserId: collaborator.userId.toString(),
          ...(universeId !== undefined && { universeId: universeId.toString() }),
        },
      });
    },
    [unifiedLogger, universeId],
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Typography variant='body1' color='error'>
        {error}
      </Typography>
    );
  }

  if (collaborators.length === 0) {
    return (
      <Typography variant='body1' color='secondary'>
        {translate('Label.NoAgeRestrictedCollaborators')}
      </Typography>
    );
  }

  const renderItem = (item: Collaborator) => {
    const profileUrl = `https://www.${process.env.robloxSiteDomain}/users/${item.userId}/profile`;

    return (
      <Link
        key={item.userId}
        href={profileUrl}
        target='_blank'
        rel='noopener noreferrer'
        underline='none'
        color='inherit'
        onClick={() => handleProfileLinkClick(item)}
        sx={{ '&:hover .collaborator-text': { textDecoration: 'underline' } }}>
        <Grid container alignItems='center' gap={1.5} sx={{ padding: '8px 0' }}>
          <Avatar alt={item.displayName} sx={{ width: 32, height: 32 }}>
            <Thumbnail2d
              targetId={item.userId}
              type={ThumbnailTypes.avatarHeadshot}
              alt={item.displayName}
              returnPolicy={ReturnPolicy.PlaceHolder}
              includeBackground
            />
          </Avatar>
          <div>
            <Grid direction='column' container item className='collaborator-text'>
              <Typography variant='captionHeader'>{item.displayName}</Typography>
              <Typography variant='captionBody' color='secondary'>
                @{item.username}
              </Typography>
            </Grid>
          </div>
        </Grid>
      </Link>
    );
  };

  return (
    <>
      {friends.length > 0 && (
        <Grid container direction='column'>
          <Typography variant='h6' sx={{ marginTop: '16px', marginBottom: '8px' }}>
            {translate('Heading.Friends')}
          </Typography>
          {friends.map(renderItem)}
        </Grid>
      )}
      {others.length > 0 && (
        <Grid container direction='column'>
          <Typography variant='h6' sx={{ marginTop: '16px', marginBottom: '8px' }}>
            {translate('Heading.NotYetFriends')}
          </Typography>
          {others.map(renderItem)}
        </Grid>
      )}
    </>
  );
};

export default withTranslation(CollaboratorsList, [
  TranslationNamespace.Creations,
]) as React.FunctionComponent<CollaboratorsListProps>;
