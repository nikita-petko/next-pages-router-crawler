import type { FunctionComponent } from 'react';
import React from 'react';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar } from '@rbx/ui';
import type { TWorkspace } from '../../../providers/WorkspaceProvider/constants';
import { CreatorType } from '../../../providers/WorkspaceProvider/constants';
import useGetWorkspaceThumbnail from '../../../queries/useGetWorkspaceThumbnail';

export interface WorkspaceThumbnailContainerProps {
  creator: Pick<TWorkspace, 'creatorId' | 'creatorName' | 'creatorType'>;
  className?: string;
}

const WorkspaceThumbnailContainer: FunctionComponent<
  React.PropsWithChildren<WorkspaceThumbnailContainerProps>
> = ({ creator, className }) => {
  const targetId = creator.creatorId ?? 0;
  const thumbnailType =
    creator.creatorType === CreatorType.Group
      ? ThumbnailTypes.groupIcon
      : ThumbnailTypes.avatarHeadshot;
  const alt = creator.creatorName ?? 'avatar';
  const variant = creator.creatorType === CreatorType.Group ? 'rounded' : 'circular';
  const { data, isLoading, isError } = useGetWorkspaceThumbnail(thumbnailType, targetId);
  const imageUrl = !isLoading && !isError ? data : undefined;

  if (imageUrl) {
    return <Avatar className={className} variant={variant} alt={alt} src={imageUrl} />;
  }

  return (
    <Avatar className={className} variant={variant} alt={alt}>
      <Thumbnail2d targetId={targetId} type={thumbnailType} alt={alt} />
    </Avatar>
  );
};

export default WorkspaceThumbnailContainer;
