import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { Thumbnail2d, ThumbnailClient, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar } from '@rbx/ui';
import type { TWorkspace } from '../../../providers/WorkspaceProvider/constants';
import { CreatorType } from '../../../providers/WorkspaceProvider/constants';

export interface WorkspaceThumbnailContainerProps {
  creator: TWorkspace;
  className?: string;
}

const thumbnailUrlCache = new Map<string, string>();

const WorkspaceThumbnailContainer: FunctionComponent<
  React.PropsWithChildren<WorkspaceThumbnailContainerProps>
> = ({ creator, className }) => {
  const targetId = creator.creatorId ?? 0;
  const thumbnailType =
    creator.creatorType === CreatorType.Group
      ? ThumbnailTypes.groupIcon
      : ThumbnailTypes.avatarHeadshot;
  const cacheKey = `${thumbnailType}:${targetId}`;
  const alt = creator.creatorName ?? 'avatar';
  const variant = creator.creatorType === CreatorType.Group ? 'rounded' : 'circular';

  const [resolved, setResolved] = useState<{ key: string; url: string } | null>(null);
  const imageUrl =
    thumbnailUrlCache.get(cacheKey) ?? (resolved?.key === cacheKey ? resolved.url : undefined);

  useEffect(() => {
    if (!targetId) {
      return undefined;
    }

    let cancelled = false;

    void ThumbnailClient.getThumbnailImage(thumbnailType, targetId)
      .then((data) => {
        if (cancelled || !data.imageUrl) {
          return;
        }
        thumbnailUrlCache.set(cacheKey, data.imageUrl);
        setResolved({ key: cacheKey, url: data.imageUrl });
      })
      .catch(() => {
        // Keep any cached URL; Thumbnail2d fallback handles first-load errors.
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, targetId, thumbnailType]);

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
