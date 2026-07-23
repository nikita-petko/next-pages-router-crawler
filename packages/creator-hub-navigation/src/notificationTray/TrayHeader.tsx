import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import type { CreatorStreamNotificationsMarkAllCreatorStreamNotificationsReadOperationRequest } from '@rbx/client-creator-notification-streams-api/v1';
import { Button as FButton, IconButton as FIconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, IconButton, SettingsIcon, Button } from '@rbx/ui';
import {
  clickNotificationSettingsButtonEventModel,
  markAllNotificationsReadEventModel,
} from '../event/eventConstants';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import { getCreatorHubBasePath } from '../utils/getBasePaths';
import { useNotificationClient } from './contexts/NotificationClientProvider';
import useTrayHeaderStyles from './TrayHeader.styles';
import type TNotificationGroup from './types/TNotificationGroup';
import CREATOR_HUB_NOTIFICATION_CHANNEL from './utils/CreatorHubNotificationChannel';

type TTrayHeader = {
  notifications: TNotificationGroup[];
  newNotificationExists: boolean;
  userId: number;
  markAllAsRead: () => void;
  setExpanded: (expanded: boolean) => void;
  onSettingsClick?: () => void;
  enableNotificationsM2?: boolean; // TODO @ahua (1/29/2026): Remove once notifications M2 is fully released. Enable for non-prod env
  markAllIsDisabled?: boolean;
  markAllReadRef?: React.RefObject<HTMLButtonElement | HTMLDivElement | HTMLAnchorElement | null>;
};

const settingsPath = '/settings/notifications';

const TrayHeader: FunctionComponent<TTrayHeader> = ({
  notifications,
  newNotificationExists,
  userId,
  markAllAsRead,
  setExpanded,
  onSettingsClick,
  markAllIsDisabled = notifications.length === 0,
  markAllReadRef = null,
  enableNotificationsM2 = false, // TODO @ahua (1/29/2026): Remove once notifications M2 is fully released. Enable for non-prod env
}) => {
  const { translate } = useTranslation();
  const { sendEvent, environment, target } = useNavigationConfigs();
  const { notificationClient } = useNotificationClient();
  const { classes: styles, cx } = useTrayHeaderStyles();

  const handleSettingsClick = useCallback(() => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      window.open(`${getCreatorHubBasePath(target, environment)}${settingsPath}`, '_self');
    }

    setExpanded(false);
    sendEvent(
      clickNotificationSettingsButtonEventModel({
        hasUnSeenNotifications: newNotificationExists,
        unreadNotificationCount: notifications.filter(
          (notification) => !notification.titleNotification.read,
        ).length,
        notificationsCount: notifications.length,
      }),
    );
  }, [
    environment,
    onSettingsClick,
    sendEvent,
    setExpanded,
    target,
    newNotificationExists,
    notifications,
  ]);

  const handleMarkAllAsReadClick = useCallback(() => {
    try {
      const args: CreatorStreamNotificationsMarkAllCreatorStreamNotificationsReadOperationRequest =
        {
          userId,
          creatorStreamNotificationsMarkAllCreatorStreamNotificationsReadRequest: {
            notificationChannel: CREATOR_HUB_NOTIFICATION_CHANNEL,
          },
        };
      notificationClient?.creatorStreamNotificationsMarkAllCreatorStreamNotificationsRead(args);
    } catch (e) {
      // NOTE (@mbae, 03/22/24): We currently don't have a dedicated error state for mark all as read.
      // For now, we prevent the error from breaking the UI further since mark all as read
      // isn't critical for viewing notifications.
      console.error('Failed to mark all as read', e);
    }
    markAllAsRead();
    sendEvent(
      markAllNotificationsReadEventModel({
        hasUnSeenNotifications: newNotificationExists,
        unreadNotificationCount: notifications.filter(
          (notification) => !notification.titleNotification.read,
        ).length,
        notificationsCount: notifications.length,
      }),
    );
  }, [userId, notificationClient, markAllAsRead, sendEvent, newNotificationExists, notifications]);

  if (enableNotificationsM2) {
    return (
      <div className='flex padding-left-xlarge padding-right-medium flex-row items-center justify-items-center'>
        <h2
          className={cx(
            styles.headerM2,
            'padding-top-large padding-bottom-medium margin-none text-heading-small content-emphasis',
          )}>
          {translate('Heading.NotificationTray')}
        </h2>
        <FButton
          className={styles.markAllAsReadButtonM2}
          variant='Utility'
          size='Medium'
          isDisabled={markAllIsDisabled}
          ref={markAllReadRef}
          onClick={handleMarkAllAsReadClick}>
          {translate('Label.MarkAllRead')}
        </FButton>
        <FIconButton
          icon='icon-regular-gear'
          size='Medium'
          variant='Utility'
          className={styles.settingsButtonM2}
          ariaLabel={translate('Action.Settings')}
          onClick={handleSettingsClick}
        />
      </div>
    );
  }
  return (
    <Grid className={styles.header}>
      <Typography variant='h6'>{translate('Heading.NotificationTray')}</Typography>
      <div>
        <Button
          size='small'
          variant='text'
          color='secondary'
          className={styles.markAllAsReadButton}
          onClick={handleMarkAllAsReadClick}>
          {translate('Action.MarkAllAsRead')}
        </Button>
        <IconButton
          aria-label={translate('Action.Settings')}
          // className={styles.closeButton}
          onClick={handleSettingsClick}>
          <SettingsIcon color='secondary' />
        </IconButton>
      </div>
    </Grid>
  );
};

export default TrayHeader;
