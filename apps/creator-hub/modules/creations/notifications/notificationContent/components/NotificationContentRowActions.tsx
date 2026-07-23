import { useAuthentication } from '@modules/authentication/providers';
import { ConfigureExperienceNotificationResponse } from '@modules/clients/notifications';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { useTranslation } from '@rbx/intl';
import { Alert, CircularProgress, IconButton, Menu, MoreHorizIcon, useSnackbar } from '@rbx/ui';
import React, { FC, useRef, useState } from 'react';
import {
  archiveNotificationContentEventModel,
  archiveNotificationContentFailedEventModel,
  archiveNotificationContentSuccessEventModel,
  copyNotificationContentAssetIdEventModel,
  initiateEditNotificationContentEventModel,
} from '../../constants/notificationEventConstants';
import { useNotificationsContent } from '../provider/NotificationsContentProvider';
import useNotificationContentListStyles from '../styles/notificationContentList';
import NotificationContentActionMenuItem, {
  NotificationContentAction,
} from './NotificationContentActionMenuItem';

type NotificationContentRowActionsProps = {
  universeId: number;
  content: ConfigureExperienceNotificationResponse;
};

const NotificationContentRowActions: FC<
  React.PropsWithChildren<NotificationContentRowActionsProps>
> = ({ universeId, content }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const {
    classes: { actionsProgress },
  } = useNotificationContentListStyles();
  const { user } = useAuthentication();
  const contentId = content.id as string;

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const anchorButtonRef = useRef<HTMLButtonElement>(null);
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { archiveNotificationContent } = useNotificationsContent();
  const editUrl = `/dashboard/creations/experiences/${universeId}/notifications/content/${contentId}/update`;

  const handleClickMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  const showBottomMsg = (msg: string) => {
    enqueue({
      message: msg,
      anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      autoHideDuration: toastDurationTime,
      autoHide: true,
      onClose: closeSnackbar,
    });
  };

  const copyText = async (text?: string, itemName?: string) => {
    setIsActionInProgress(true);
    try {
      await navigator.clipboard.writeText(text ?? '');

      if (translate && itemName) {
        showBottomMsg(translate('Message.CopyItemSuccess', { item: itemName }));
      }
    } finally {
      setIsActionInProgress(false);
    }
  };

  const onCopyAssetId = (event: React.MouseEvent) => {
    event.preventDefault();
    trackerClient.sendEvent(
      copyNotificationContentAssetIdEventModel(user?.id, universeId, contentId),
    );
    copyText(contentId, translate('Common.ID'));
    handleCloseMenu();
  };

  const archiveContent = async () => {
    setIsActionInProgress(true);
    trackerClient.sendEvent(archiveNotificationContentEventModel(user?.id, universeId, contentId));
    try {
      await archiveNotificationContent(contentId);
      trackerClient.sendEvent(
        archiveNotificationContentSuccessEventModel(user?.id, universeId, contentId),
      );
      enqueue(
        {
          children: <Alert severity='success'>{translate('Message.DeleteSuccess')}</Alert>,
          autoHide: true,
          autoHideDuration: toastDurationTime,
        },
        (reason) => reason === 'timeout',
      );
    } catch {
      trackerClient.sendEvent(
        archiveNotificationContentFailedEventModel(user?.id, universeId, contentId),
      );
      enqueue(
        {
          children: (
            <Alert severity='error'>
              {translate('Message.ArchiveFailureWithContent', {
                contentId,
              })}
            </Alert>
          ),
          autoHide: true,
          autoHideDuration: toastDurationTime,
        },
        (reason) => reason === 'timeout',
      );
    } finally {
      setIsActionInProgress(false);
    }
  };

  const onArchive = async (event: React.MouseEvent) => {
    event.preventDefault();
    archiveContent();
    handleCloseMenu();
  };

  const onEdit = () => {
    trackerClient.sendEvent(
      initiateEditNotificationContentEventModel(user?.id, universeId, contentId),
    );
  };

  const NotificationContentActionsList: NotificationContentAction[] = [
    {
      name: 'archive',
      label: translate('Common.Delete'),
      method: onArchive,
    },
    {
      name: 'copyAssetId',
      label: translate('Action.CopyAssetID'),
      method: onCopyAssetId,
    },
    {
      name: 'edit',
      label: translate('Common.Edit'),
      url: editUrl,
      method: onEdit,
    },
  ];

  return isActionInProgress ? (
    <CircularProgress
      size={20}
      color='secondary'
      classes={{
        root: actionsProgress,
      }}
    />
  ) : (
    <React.Fragment>
      <IconButton
        data-testid='notification-actions-button'
        aria-haspopup
        aria-label={translate('Label.ActionsForContent', {
          label: content.name ?? '',
        })}
        onClick={handleClickMenu}
        ref={anchorButtonRef}
        size='large'>
        <MoreHorizIcon color='secondary' />
      </IconButton>
      <Menu
        anchorEl={anchorButtonRef.current}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        disablePortal={false}>
        {NotificationContentActionsList.map((action, index) => (
          <NotificationContentActionMenuItem key={action.name} index={index} {...action} />
        ))}
      </Menu>
    </React.Fragment>
  );
};

export default NotificationContentRowActions;
