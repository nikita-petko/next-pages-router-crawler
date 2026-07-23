import type { FunctionComponent } from 'react';
import React from 'react';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar } from '@rbx/ui';
import CreatorType from '../enums/Creator';
import type Creator from '../interfaces/Creator';

export interface CreatorThumbnailContainerProps {
  creator: Creator;
  className?: string;
}

const CreatorThumbnailContainer: FunctionComponent<
  React.PropsWithChildren<CreatorThumbnailContainerProps>
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
export default CreatorThumbnailContainer;
