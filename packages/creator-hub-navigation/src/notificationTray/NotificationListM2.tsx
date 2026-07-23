import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ProgressCircle, Snackbar, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type useNotificationsM2Tracking from './hooks/useNotificationsM2Tracking';
import NotificationV2 from './notificationGroups/NotificationV2';
import useNotificationListStyles from './NotificationList.styles';
import FailedToLoad from './spotIllustrations/FailedToLoad';
import NoNewNotifications from './spotIllustrations/NoNewNotifications';
import TrayHeader from './TrayHeader';
import type TNotificationGroup from './types/TNotificationGroup';

export type TFreshNotificationsSnackbarProps = {
  count: number;
  show: boolean;
  close: () => void;
  onScrollToTop: () => void;
};

type TNotificationListM2Props = {
  expanded: boolean;
  failedToLoadPage: boolean;
  loadingMoreNotifs: boolean;
  notifications: TNotificationGroup[];
  newNotificationExists: boolean;
  userId: number;
  markAllAsRead: () => void;
  setExpanded: (expanded: boolean) => void;
  onSettingsClick?: () => void;
  markReadStatus: (notificationId: string, readStatus: boolean) => void;
  listRef: React.MutableRefObject<HTMLDivElement | null>;
  freshNotificationsSnackbar: TFreshNotificationsSnackbarProps;
  listScrollRef: React.MutableRefObject<{
    scrollTop: number;
    scrollHeight: number;
  }> | null;
  failedMarkingNotification: boolean;
  setFailedMarkingNotification: (failedMarkingNotification: boolean) => void;
  avoidLoadingMoreNotifs: boolean;
  retryNotifications: () => void;
  setNewUnseenNotifFrontier: ReturnType<
    typeof useNotificationsM2Tracking
  >['setNewUnseenNotifFrontier'];
  unseenNotifFrontierIndex: number;
  reportNewUnseenNotifFrontier: ReturnType<
    typeof useNotificationsM2Tracking
  >['reportNewUnseenNotifFrontier'];
  trayContentFirstFocusableElRef: React.RefObject<
    HTMLDivElement | HTMLAnchorElement | HTMLButtonElement | null
  >;
  showNewLookTooltip: boolean;
};

const MAX_NEW_NOTIFS_COUNT_DISPLAYED = 10;

const TopOfListHandler: React.FC<{ handler: () => void }> = ({ handler }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // user is at top of list
            handler();
          }
        });
      },
      {
        root: null,
        threshold: 0.9,
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, handler]);

  return <div ref={ref} style={{ height: 0, width: 0, opacity: 0 }} />;
};

const NotificationListM2 = React.forwardRef<HTMLDivElement, TNotificationListM2Props>(
  (
    {
      failedToLoadPage,
      loadingMoreNotifs,
      avoidLoadingMoreNotifs,
      notifications,
      newNotificationExists,
      userId,
      markAllAsRead,
      setExpanded,
      onSettingsClick,
      markReadStatus,
      listRef,
      freshNotificationsSnackbar = {
        count: 0,
        show: false,
        close: () => {},
        onScrollToTop: () => {},
      },
      failedMarkingNotification,
      setFailedMarkingNotification,
      retryNotifications,
      setNewUnseenNotifFrontier,
      reportNewUnseenNotifFrontier,
      listScrollRef,
      unseenNotifFrontierIndex,
      trayContentFirstFocusableElRef,
      showNewLookTooltip,
    },
    ref,
  ) => {
    const {
      count: freshNotifsSnackbarCount = 0,
      show: showFreshUnseenNotifsSnackbar = false,
      close: closeFreshNotificationsSnackbar = () => {},
      onScrollToTop,
    } = freshNotificationsSnackbar;
    const { translate } = useTranslation();
    const [listMounted, setListMounted] = useState(false);
    const { classes: styles, cx } = useNotificationListStyles();
    const [isListOverflowing, setIsListOverflowing] = useState(false);
    const setRef = useCallback(
      (el: HTMLDivElement | null) => {
        listRef.current = el;
        setListMounted(!!el);
      },
      [listRef],
    );

    const updateOverflowState = useCallback(() => {
      const el = listRef.current;
      if (!el) {
        return;
      }
      setIsListOverflowing(el.scrollHeight > el.clientHeight);
    }, [listRef]);

    useEffect(() => {
      const el = listRef.current;
      if (!el) {
        return undefined;
      }
      updateOverflowState();
      const resizeObserver = new ResizeObserver(updateOverflowState);
      resizeObserver.observe(el);
      return () => resizeObserver.disconnect();
    }, [listRef, updateOverflowState, notifications.length, loadingMoreNotifs]);

    /**
     * Error states handling:
     *
     * The error snackbar is shown on:
     *  - Failed to page notifications (beyond 1st page)
     *  - Failed to mark a notification as read/unread
     * The tray error ui is shown on:
     *  - Failed to load 1st page (no notifs/no 1st page + failedToLoadPage)
     *  - User hits 'retry' on tray error ui, and retry fails
     */
    const emptyListContainerClassName = cx(
      'flex flex-col items-center justify-center',
      styles.listContainerM2,
      styles.emptyStateContainer,
    );

    const scrollToTop = useCallback(() => {
      if (listRef.current) {
        listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        onScrollToTop();
      }
    }, [listRef, onScrollToTop]);

    const onTopOfList = useCallback(() => {
      // spec: reset last seen notif frontier, clearing bell count
      setNewUnseenNotifFrontier(notifications[0].titleNotification.notificationId);
    }, [setNewUnseenNotifFrontier, notifications]);

    // on scrollToTop call + manual scroll to top, call onScrollToTop handler
    useEffect(() => {
      const listElement = listRef.current;
      if (!listElement) {
        return undefined;
      }
      const trackScrollPos = () => {
        if (listScrollRef?.current) {
          listScrollRef.current = {
            scrollTop: listElement.scrollTop,
            scrollHeight: listElement.scrollHeight,
          };
        }
      };
      const runTrackScrollPosAfterFocus = () => {
        requestAnimationFrame(trackScrollPos);
      };

      trackScrollPos();

      listElement.addEventListener('scroll', trackScrollPos);
      listElement.addEventListener('focusin', runTrackScrollPosAfterFocus);
      return () => {
        listElement.removeEventListener('scroll', trackScrollPos);
        listElement.removeEventListener('focusin', runTrackScrollPosAfterFocus);
      };
    }, [listRef, listMounted, listScrollRef]);

    let contents = null;
    let showErrorTrayUI = false;
    if (!notifications || notifications.length === 0) {
      if (loadingMoreNotifs) {
        // loading state
        contents = (
          <div className={emptyListContainerClassName}>
            <ProgressCircle
              size='Large'
              variant='Indeterminate'
              ariaLabel={translate('Label.Loading')}
              value={50}
            />
          </div>
        );
      } else if (failedToLoadPage) {
        // tray-wide error ui
        showErrorTrayUI = true;
        contents = (
          <div className={emptyListContainerClassName}>
            <div className='flex flex-col items-center gap-2'>
              <FailedToLoad enableNotificationsM2 size={72} />
              <h4
                className={cx(
                  styles.emptyStateHeader,
                  styles.errorStateHeader,
                  'text-heading-small content-emphasis',
                )}>
                {translate('Label.SomethingWentWrong') || 'Something went wrong'}
              </h4>
              <p className={cx(styles.emptyStateDescription, 'text-body-medium content-default')}>
                {translate('Description.NotificationsFailed') || 'Notifications failed to load'}
              </p>
            </div>
            <Button
              className={styles.retryButton}
              variant='Standard'
              size='Medium'
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                e.stopPropagation();
                retryNotifications();
              }}>
              {translate('Label.Retry') || 'Retry'}
            </Button>
          </div>
        );
      } else {
        // empty state
        contents = (
          <div className={emptyListContainerClassName}>
            <NoNewNotifications enableNotificationsM2 size={128} />
            <h2 className={cx(styles.emptyStateHeader, 'text-heading-small content-emphasis')}>
              {translate('Label.NoNotificationsAvailable')}
            </h2>
            <p className={cx(styles.emptyStateDescription, 'text-body-medium content-default')}>
              {translate('Description.NoNotificationsAvailable')}
            </p>
          </div>
        );
      }
    } else {
      // some notifications were loaded already

      // loading more notifs + notifs list states
      contents = (
        <div ref={setRef} className={cx(styles.scrollableY, styles.scrollableYM2)}>
          <TopOfListHandler handler={onTopOfList} />
          {notifications.map((notificationGroup: TNotificationGroup, index: number) => {
            // TODO: once M2 is fully released, rename notificationGroupIndex to
            // notificationsIndex (bundled notifs are deprecated now, so
            // we can remove the group concept)
            const props = {
              notificationContent: notificationGroup.titleNotification,
              notificationGroupIndex: index,
              markReadStatus,
              enableNotificationsM2: true,
              isListOverflowing,
              reportNewUnseenNotifFrontier,
              unseenNotifFrontierIndex,
            };
            if (index === 0) {
              return (
                <NotificationV2
                  {...props}
                  key={notificationGroup.titleNotification.notificationId}
                  ref={trayContentFirstFocusableElRef as React.RefObject<HTMLDivElement | null>}
                />
              );
            }
            return (
              <NotificationV2 key={notificationGroup.titleNotification.notificationId} {...props} />
            );
          })}
          {loadingMoreNotifs && !avoidLoadingMoreNotifs && (
            <div className='flex items-center justify-center padding-large'>
              <ProgressCircle
                size='Medium'
                variant='Indeterminate'
                ariaLabel={translate('Label.LoadingMore')}
                value={50}
              />
            </div>
          )}
        </div>
      );
    }

    const showErrorSnackbar = !showErrorTrayUI && (failedToLoadPage || failedMarkingNotification);
    const freshNotifsSnackbarText = useMemo(() => {
      if (freshNotifsSnackbarCount === 0) {
        return '';
      }
      return translate(
        freshNotifsSnackbarCount === 1
          ? 'Label.OneNewNotification'
          : 'Message.NewNotificationsWithCount',
        {
          count:
            Math.min(MAX_NEW_NOTIFS_COUNT_DISPLAYED, freshNotifsSnackbarCount) +
            (freshNotifsSnackbarCount >= MAX_NEW_NOTIFS_COUNT_DISPLAYED ? '+' : ''),
        },
      );
    }, [freshNotifsSnackbarCount, translate]);
    const markAllIsDisabled = useMemo(() => notifications.length === 0, [notifications]);

    const trayContent = (
      <div
        ref={ref}
        aria-label={translate('Label.NotificationTray') || 'Notification Tray'}
        className={cx(
          'shadow-transient-high radius-large stroke-standard stroke-muted bg-surface-100 border-color-standard border border-radius-large relative flex flex-col',
          styles.notificationsM2,
        )}>
        {showErrorSnackbar && (
          <Snackbar
            onClose={() => setFailedMarkingNotification(false)}
            shouldAutoDismiss
            title={translate('Message.GenericError')}
          />
        )}
        {showFreshUnseenNotifsSnackbar && freshNotifsSnackbarCount > 0 && (
          <div className={styles.snackbarM2Wrapper}>
            <Snackbar
              className={styles.snackbarM2}
              title={freshNotifsSnackbarText}
              shouldAutoDismiss
              onClose={closeFreshNotificationsSnackbar}
              onClick={(e) => {
                e.stopPropagation();
                const isClickToDismiss = (e.target as HTMLElement).closest('button') !== null;
                if (isClickToDismiss) {
                  return;
                }
                scrollToTop();
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                e.stopPropagation();
                if (e.key === 'Enter' || e.key === ' ') {
                  scrollToTop();
                }
              }}
            />
          </div>
        )}
        <TrayHeader
          markAllIsDisabled={markAllIsDisabled}
          markAllReadRef={markAllIsDisabled ? undefined : trayContentFirstFocusableElRef}
          notifications={notifications}
          newNotificationExists={newNotificationExists}
          userId={userId}
          markAllAsRead={markAllAsRead}
          setExpanded={setExpanded}
          onSettingsClick={onSettingsClick}
          enableNotificationsM2
        />
        {contents}
      </div>
    );

    return (
      <Tooltip
        hasBeak
        delayDurationMs={0}
        open={showNewLookTooltip}
        onOpenChange={() => {}}
        title={translate('Message.NotificationsHasNewLookTitle')}
        description={translate('Message.NotificationsHasNewLookDescription')}
        position='left-start'
        contentClassName={styles.tooltipContent}>
        <TooltipTrigger asChild>{trayContent}</TooltipTrigger>
      </Tooltip>
    );
  },
);

NotificationListM2.displayName = 'NotificationListM2';

export default NotificationListM2;
