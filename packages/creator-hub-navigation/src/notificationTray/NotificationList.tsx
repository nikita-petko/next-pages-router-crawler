import React, { useEffect, useCallback, useState } from 'react';
import type { CreatorStreamNotificationsMarkCreatorStreamNotificationsReadOperationRequest } from '@rbx/client-creator-notification-streams-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, CircularProgress, Typography, Snackbar, Button } from '@rbx/ui';
import { useNotificationClient } from './contexts/NotificationClientProvider';
import signalREventEmitter from './contexts/SignalREventEmitter';
import type useNotificationsM2Tracking from './hooks/useNotificationsM2Tracking';
import BundledNotification from './notificationGroups/BundledNotification';
import NotificationV2 from './notificationGroups/NotificationV2';
import useNotificationListStyles from './NotificationList.styles';
import NotificationListM2, { type TFreshNotificationsSnackbarProps } from './NotificationListM2';
import FailedToLoad from './spotIllustrations/FailedToLoad';
import NoNewNotifications from './spotIllustrations/NoNewNotifications';
import TrayHeader from './TrayHeader';
import type TNotificationGroup from './types/TNotificationGroup';
import LoadNotificationsType from './utils/LoadNotifications';

type TNotificationListProps = {
  failedToLoad: boolean;
  listRef: React.MutableRefObject<HTMLDivElement | null>;
  loadingTray: boolean;
  markAllAsRead: () => void;
  newNotificationExists: boolean;
  noMoreNotifications: boolean;
  notifications: TNotificationGroup[];
  setNewNotificationExists: (notificationExists: boolean) => void;
  setNotifications: React.Dispatch<React.SetStateAction<TNotificationGroup[]>>;
  userId: number;
  loadPage: (loadNotificationsType: LoadNotificationsType) => void;
  setExpanded: (expanded: boolean) => void;
  onSettingsClick?: () => void;
  enableNotificationsM2?: boolean;
  freshNotificationsSnackbar: TFreshNotificationsSnackbarProps;
  reportNewUnseenNotifFrontier: ReturnType<
    typeof useNotificationsM2Tracking
  >['reportNewUnseenNotifFrontier'];
  setNewUnseenNotifFrontier: ReturnType<
    typeof useNotificationsM2Tracking
  >['setNewUnseenNotifFrontier'];
  listScrollRef: React.MutableRefObject<{
    scrollTop: number;
    scrollHeight: number;
  }> | null;
  unseenNotifFrontierIndex: number;
  expanded: boolean;
  trayContentFirstFocusableElRef: React.RefObject<
    HTMLDivElement | HTMLAnchorElement | HTMLButtonElement | null
  >;
  showNewLookTooltip: boolean;
};

const NEXT_PAGE_SCROLL_THRESHOLD = 250;

const NotificationList = React.forwardRef<HTMLDivElement, TNotificationListProps>(
  (
    {
      failedToLoad,
      listRef,
      loadingTray,
      markAllAsRead,
      newNotificationExists,
      noMoreNotifications,
      notifications,
      setNewNotificationExists,
      setNotifications,
      userId,
      loadPage,
      setExpanded,
      onSettingsClick,
      enableNotificationsM2,
      freshNotificationsSnackbar,
      reportNewUnseenNotifFrontier,
      setNewUnseenNotifFrontier,
      listScrollRef,
      unseenNotifFrontierIndex,
      expanded,
      trayContentFirstFocusableElRef,
      showNewLookTooltip,
    },
    ref: React.ForwardedRef<HTMLDivElement | null>,
  ) => {
    const { translate } = useTranslation();
    const { classes: styles, cx } = useNotificationListStyles();
    const { notificationClient } = useNotificationClient();
    const [failedMarkingNotification, setFailedMarkingNotification] = useState<boolean>(false);

    const showFailedToLoadNotifications = failedToLoad && notifications.length === 0;
    const loadingNotifs =
      !showFailedToLoadNotifications &&
      !noMoreNotifications &&
      (!notifications || notifications.length === 0);
    const elementsLoaded = !showFailedToLoadNotifications && !loadingNotifs;

    const reloadAllNotifications = useCallback(() => {
      setNewNotificationExists(false);
      setNotifications([]);
      loadPage(LoadNotificationsType.ReloadAll);
    }, [loadPage, setNewNotificationExists, setNotifications]);

    const onAllNotificationsReadFromSignalR = useCallback(() => {
      setNotifications((currentNotifications) => {
        const newNotifications = currentNotifications.map((currentNotification) => {
          const updatedNotification = structuredClone(currentNotification);
          updatedNotification.titleNotification.read = true;

          updatedNotification.children?.forEach((child) => {
            child.read = true;
          });

          return updatedNotification;
        });

        return newNotifications;
      });
    }, [setNotifications]);

    const setNotificationReadStatus = useCallback(
      (read: boolean, notificationId: string) => {
        setNotifications((currentNotifications) =>
          currentNotifications.map((currentNotification) => {
            if (currentNotification.titleNotification.notificationId !== notificationId) {
              return currentNotification;
            }
            return {
              ...currentNotification,
              titleNotification: { ...currentNotification.titleNotification, read },
            };
          }),
        );
      },
      [setNotifications],
    );

    const markReadStatus = useCallback(
      async (notificationId: string, readStatus: boolean) => {
        try {
          const args: CreatorStreamNotificationsMarkCreatorStreamNotificationsReadOperationRequest =
            {
              userId,
              notificationId,
              creatorStreamNotificationsMarkCreatorStreamNotificationsReadRequest: {
                status: readStatus,
              },
            };
          await notificationClient?.creatorStreamNotificationsMarkCreatorStreamNotificationsRead(
            args,
          );
          setNotificationReadStatus(readStatus, notificationId);
          setFailedMarkingNotification(false);
        } catch {
          setFailedMarkingNotification(true);
        }
      },
      [notificationClient, setNotificationReadStatus, userId],
    );

    useEffect(() => {
      const onNotificationReadFromSignalR = (notificationId: string) =>
        setNotificationReadStatus(true, notificationId);
      const onNotificationUnreadFromSignalR = (notificationId: string) =>
        setNotificationReadStatus(false, notificationId);

      signalREventEmitter.on('notificationRead', onNotificationReadFromSignalR);
      signalREventEmitter.on('notificationUnread', onNotificationUnreadFromSignalR);
      signalREventEmitter.on('allNotificationsRead', onAllNotificationsReadFromSignalR);
      return () => {
        signalREventEmitter.removeListener('notificationRead', onNotificationReadFromSignalR);
        signalREventEmitter.removeListener('notificationUnread', onNotificationUnreadFromSignalR);
        signalREventEmitter.removeListener(
          'allNotificationsRead',
          onAllNotificationsReadFromSignalR,
        );
      };
    }, [onAllNotificationsReadFromSignalR, setNotificationReadStatus]);

    useEffect(() => {
      if (!elementsLoaded) {
        return () => {
          // Do nothing
        };
      }

      const handleScroll = () => {
        if (listRef.current) {
          const { scrollHeight, scrollTop, clientHeight } = listRef.current;
          const pixelsFromBottom = scrollHeight - scrollTop - clientHeight;

          if (pixelsFromBottom <= NEXT_PAGE_SCROLL_THRESHOLD) {
            loadPage(LoadNotificationsType.Paginate);
          }
        }
      };

      const container = listRef.current;
      if (container) {
        container.addEventListener('scroll', handleScroll);
      }

      return () => {
        if (container) {
          container.removeEventListener('scroll', handleScroll);
        }
      };
    }, [elementsLoaded, listRef, loadPage]);

    if (enableNotificationsM2) {
      return (
        <NotificationListM2
          ref={ref}
          showNewLookTooltip={showNewLookTooltip}
          trayContentFirstFocusableElRef={trayContentFirstFocusableElRef}
          expanded={expanded}
          reportNewUnseenNotifFrontier={reportNewUnseenNotifFrontier}
          avoidLoadingMoreNotifs={noMoreNotifications}
          failedToLoadPage={failedToLoad}
          loadingMoreNotifs={loadingTray}
          notifications={notifications}
          newNotificationExists={newNotificationExists}
          userId={userId}
          markAllAsRead={markAllAsRead}
          setExpanded={setExpanded}
          onSettingsClick={onSettingsClick}
          markReadStatus={markReadStatus}
          failedMarkingNotification={failedMarkingNotification}
          setFailedMarkingNotification={setFailedMarkingNotification}
          retryNotifications={reloadAllNotifications}
          listRef={listRef}
          freshNotificationsSnackbar={freshNotificationsSnackbar}
          setNewUnseenNotifFrontier={setNewUnseenNotifFrontier}
          listScrollRef={listScrollRef}
          unseenNotifFrontierIndex={unseenNotifFrontierIndex}
        />
      );
    }

    return (
      <div ref={ref} className={styles.skeleton}>
        <div className={styles.skeletonTray}>
          <div className={styles.outerContainer}>
            <div className={styles.snackbarContainer}>
              <Snackbar
                anchorOrigin={{
                  horizontal: 'center',
                  vertical: 'top',
                }}
                open={newNotificationExists}
                autoHideDuration={6000}
                className={styles.snackbarContainer}
                onClick={reloadAllNotifications}>
                <div className={styles.snackbarContent}>
                  <Typography variant='body1'>
                    {translate('Action.ViewNewNotifications')}
                  </Typography>
                </div>
              </Snackbar>
            </div>
            <TrayHeader
              notifications={notifications}
              newNotificationExists={newNotificationExists}
              userId={userId}
              markAllAsRead={markAllAsRead}
              setExpanded={setExpanded}
              onSettingsClick={onSettingsClick}
              enableNotificationsM2={enableNotificationsM2}
              markAllIsDisabled={notifications.length === 0}
            />
            {showFailedToLoadNotifications && (
              <Grid
                container
                justifyContent='center'
                alignItems='center'
                flexDirection='column'
                spacing={3}
                className={styles.fullCenter}>
                <Grid
                  container
                  justifyContent='center'
                  alignItems='center'
                  flexDirection='column'
                  spacing={0.5}
                  item>
                  <Grid item>
                    <FailedToLoad size={128} />
                  </Grid>
                  <Grid item>
                    <Typography variant='h4'>{translate('Label.NotificationLoadFail')}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant='body2' color='secondary'>
                      {translate('Label.NotificationRetrySuggestion')}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid item>
                  <Button color='primary' variant='outlined' onClick={reloadAllNotifications}>
                    {translate('Action.NotificationRefresh')}
                  </Button>
                </Grid>
              </Grid>
            )}
            {loadingNotifs && (
              <Grid
                container
                justifyContent='center'
                alignItems='center'
                className={styles.fullCenter}>
                <CircularProgress />
              </Grid>
            )}
            {elementsLoaded && notifications.length > 0 && (
              <Grid ref={listRef} className={cx(styles.listContainer, styles.scrollableY)}>
                {notifications.map((notificationGroup: TNotificationGroup, index: number) => {
                  return (
                    <Grid
                      className={styles.notificationContainer}
                      key={`group-${notificationGroup.titleNotification.notificationId}`}>
                      {(notificationGroup.groupingType === 'None' ||
                        notificationGroup.groupingType === 'Summarized') && (
                        <NotificationV2
                          enableNotificationsM2={enableNotificationsM2 ?? false}
                          reportNewUnseenNotifFrontier={reportNewUnseenNotifFrontier}
                          notificationContent={notificationGroup.titleNotification}
                          notificationGroupIndex={index}
                          markReadStatus={markReadStatus}
                        />
                      )}
                      {notificationGroup.groupingType === 'Bundled' && (
                        <BundledNotification
                          notificationGroup={notificationGroup}
                          notificationGroupIndex={index}
                          markReadStatus={markReadStatus}
                        />
                      )}
                    </Grid>
                  );
                })}
                {loadingTray && (
                  <Grid
                    container
                    justifyContent='center'
                    alignItems='center'
                    className={styles.bottomLoader}>
                    <CircularProgress />
                  </Grid>
                )}
              </Grid>
            )}
            {elementsLoaded && notifications.length === 0 && (
              <Grid
                container
                justifyContent='center'
                alignItems='center'
                flexDirection='column'
                spacing={0.5}
                className={styles.fullCenter}>
                <Grid item>
                  <NoNewNotifications size={128} />
                </Grid>
                <Grid item>
                  <Typography variant='h4' color='secondary'>
                    {translate('Label.NoNotificationsAvailable')}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </div>
        </div>
      </div>
    );
  },
);

NotificationList.displayName = 'NotificationList';

export default NotificationList;
