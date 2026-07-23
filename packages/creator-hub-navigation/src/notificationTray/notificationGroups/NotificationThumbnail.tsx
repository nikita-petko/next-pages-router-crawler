import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar } from '@rbx/ui';
import ENotificationTargetType from '../types/ENotificationTargetType';
import NotificationIcon from './NotificationIcon';
import useNotificationThumbnailStyles from './NotificationThumbnail.styles';
import RobloxLogoTile from './RobloxLogoTile';

type NotificationThumbnailProps = {
  targetType?: number;
  targetId?: string;
  enableNotificationsM2: boolean;
};

const M2IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { classes: styles, cx } = useNotificationThumbnailStyles();
  return (
    <div
      className={cx(
        'bg-surface-300 radius-medium flex items-center justify-center',
        styles.m2Thumbnail,
      )}>
      {children}
    </div>
  );
};

const NotificationThumbnail: React.FC<NotificationThumbnailProps> = ({
  targetType,
  targetId,
  enableNotificationsM2,
}) => {
  const { translate } = useTranslation();
  const { classes: styles } = useNotificationThumbnailStyles();
  if (targetId === 'RobloxLogo') {
    return <RobloxLogoTile size={48} />;
  }
  switch (targetType) {
    case ENotificationTargetType.Universe:
      if (enableNotificationsM2) {
        return (
          <M2IconWrapper>
            <Thumbnail2d
              data-target-id={targetId}
              targetId={Number(targetId) ?? 0}
              type={ThumbnailTypes.gameIcon}
              imgClassName='radius-medium'
              alt={translate('Label.UniverseThumbnailAltString')}
            />
          </M2IconWrapper>
        );
      }
      return (
        <Avatar
          alt={translate('Label.UniverseThumbnailAltString')}
          variant='rounded'
          className={styles.m1Thumbnail}>
          <Thumbnail2d
            targetId={Number(targetId) ?? 0}
            type={ThumbnailTypes.gameIcon}
            imgClassName='radius-medium'
            alt={translate('Label.UniverseThumbnailAltString')}
          />
        </Avatar>
      );
    case ENotificationTargetType.User:
      if (enableNotificationsM2) {
        return (
          <Avatar className={styles.m2Thumbnail}>
            <Thumbnail2d
              data-target-id={targetId}
              targetId={Number(targetId) ?? 0}
              type={ThumbnailTypes.avatarHeadshot}
              imgClassName='radius-medium'
              alt={translate('Label.AvatarThumbnail')}
            />
          </Avatar>
        );
      }
      return (
        <Avatar
          alt={translate('Label.AvatarThumbnail')}
          variant='rounded'
          className={styles.m1Thumbnail}>
          <Thumbnail2d
            targetId={Number(targetId) ?? 0}
            type={ThumbnailTypes.avatarHeadshot}
            imgClassName='radius-medium'
            alt={translate('Label.AvatarThumbnail')}
          />
        </Avatar>
      );
    case ENotificationTargetType.Static:
      return (
        <M2IconWrapper>
          <NotificationIcon targetId={targetId} enableNotificationsM2={enableNotificationsM2} />
        </M2IconWrapper>
      );
    case ENotificationTargetType.Asset:
      return (
        <M2IconWrapper>
          <Thumbnail2d
            data-target-id={targetId}
            targetId={Number(targetId) ?? 0}
            type={ThumbnailTypes.assetThumbnail}
            imgClassName='radius-medium'
            alt={translate('Label.AssetIconAltString')}
          />
        </M2IconWrapper>
      );
    case ENotificationTargetType.Group:
      return (
        <M2IconWrapper>
          <Thumbnail2d
            data-target-id={targetId}
            targetId={Number(targetId) ?? 0}
            type={ThumbnailTypes.groupIcon}
            imgClassName='radius-medium'
            alt={translate('Label.GroupIconAltString')}
          />
        </M2IconWrapper>
      );
    default:
      return (
        <M2IconWrapper>
          <NotificationIcon enableNotificationsM2={enableNotificationsM2} />
        </M2IconWrapper>
      );
  }
};

export default NotificationThumbnail;
