import React, { FunctionComponent, useMemo } from 'react';
import { Avatar } from '@rbx/ui';
import { SubjectType } from '@rbx/clients/assetPermissionsApi';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { SharedSubjectDetails } from './types';
import usePermissionThumbnailStyles from './PermissionThumbnail.styles';

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
