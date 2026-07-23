import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { SubjectType } from '@rbx/client-asset-permissions-api/v1';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar } from '@rbx/ui';
import usePermissionThumbnailStyles from './PermissionThumbnail.styles';
import type { SharedSubjectDetails } from './types';

export type PermissionThumbnailProps = {
  subject: SharedSubjectDetails;
};

const PermissionThumbnail: FunctionComponent<React.PropsWithChildren<PermissionThumbnailProps>> = ({
  subject,
}) => {
  const {
    classes: { groupThumbnail },
  } = usePermissionThumbnailStyles();

  const thumbnailType = useMemo(() => {
    switch (subject.subjectType) {
      case SubjectType.User:
        return ThumbnailTypes.avatarHeadshot;
      case SubjectType.Group:
        return ThumbnailTypes.groupIcon;
      case SubjectType.Universe:
      default:
        return ThumbnailTypes.gameIcon;
    }
  }, [subject.subjectType]);

  const thumbnailVariant = useMemo(() => {
    switch (thumbnailType) {
      case ThumbnailTypes.gameIcon:
      case ThumbnailTypes.groupIcon:
        return 'square';
      case ThumbnailTypes.avatarHeadshot:
      default:
        return 'circular';
    }
  }, [thumbnailType]);

  return (
    <Avatar
      alt=''
      data-testid='permission-thumbnail'
      className={subject.subjectType === SubjectType.Group ? groupThumbnail : undefined}
      variant={thumbnailVariant}>
      <Thumbnail2d
        alt=''
        returnPolicy={ReturnPolicy.PlaceHolder}
        targetId={subject.subjectId}
        type={thumbnailType}
      />
    </Avatar>
  );
};

export default PermissionThumbnail;
