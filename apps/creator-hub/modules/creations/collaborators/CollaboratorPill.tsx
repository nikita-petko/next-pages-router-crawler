import type { FC } from 'react';
import { Avatar, Chip } from '@rbx/foundation-ui';
import { getUserUrl } from '@modules/miscellaneous/urls/www';
import type { CollaboratorData } from './types';

export const CollaboratorPill: FC<{
  collaborator: CollaboratorData;
  onProfileClick: (userId: number) => void;
}> = ({ collaborator, onProfileClick }) => (
  <Chip
    leadingIconNode={
      <Avatar
        alt={collaborator.displayName}
        src={collaborator.thumbnailUrl}
        className='!size-600'
      />
    }
    text={collaborator.displayName}
    as='a'
    onClick={() => onProfileClick(collaborator.userId)}
    href={getUserUrl(collaborator.userId)}
    rel='noopener noreferrer'
    target='_blank'
    className='size-fit'
  />
);
