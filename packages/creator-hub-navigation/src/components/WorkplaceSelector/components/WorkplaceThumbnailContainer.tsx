import React, { FunctionComponent } from 'react';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar } from '@rbx/ui';
import { CreatorType, TWorkspace } from '../../../providers/WorkspaceProvider/constants';

export interface WorkspaceThumbnailContainerProps {
  creator: TWorkspace;
  className?: string;
}

const WorkspaceThumbnailContainer: FunctionComponent<
  React.PropsWithChildren<WorkspaceThumbnailContainerProps>
> = ({ creator, className }) => {
  return (
    <Avatar
      className={className}
      variant={creator.creatorType === CreatorType.Group ? 'rounded' : 'circular'}
      alt='avatar'>
      <Thumbnail2d
        targetId={creator.creatorId ?? 0}
        type={
          creator.creatorType === CreatorType.Group
            ? ThumbnailTypes.groupIcon
            : ThumbnailTypes.avatarHeadshot
        }
        alt={creator.creatorName ?? 'avatar'}
      />
    </Avatar>
  );
};
export default WorkspaceThumbnailContainer;
