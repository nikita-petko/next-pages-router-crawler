import type { FunctionComponent } from 'react';
import React, { useMemo, useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type {
  CreatorStreamNotification,
  CreatorStreamNotificationsGetCreatorStreamNotificationsByUserRequest,
} from '@rbx/client-creator-notification-streams-api/v1';
import { IconButton as FoundationIconButton } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import {
  getRealTimeNotificationsBasePath,
  useSignalR,
  type TSignalRCallback,
} from '@rbx/signalr-userhub-client';
import type { TIconButtonProps } from '@rbx/ui';
import {
  Grid,
  NotificationsIcon,
  Badge,
  IconButton,
  NotificationsOutlinedIcon,
  useMediaQuery,
} from '@rbx/ui';
import {
  notificationsImpressionEventModel,
  openNotificationTrayEventModel,
  closeNotificationTrayEventModel,
  NotificationTrayCloseSource,
  notificationBellIconImpressionEventModel,
} from '../event/eventConstants';
import useNavigationConfigs from '../hooks/useNavigationConfigs';
import type { TSendEvent } from '../providers/EventProvider';
import {
  NOTIFICATION_CLIENT_PAGE_SIZE,
  NotificationClientProvider,
  useNotificationClient,
} from './contexts/NotificationClientProvider';
import signalREventEmitter from './contexts/SignalREventEmitter';
import useNotificationsM2Tracking from './hooks/useNotificationsM2Tracking';
import useNotificationBellStyles from './NotificationBell.styles';
import NotificationList from './NotificationList';
import type TNotificationGroup from './types/TNotificationGroup';
import type { User } from './types/user';
import CREATOR_HUB_NOTIFICATION_CHANNEL from './utils/CreatorHubNotificationChannel';
import formatNotifications from './utils/formatNotifications';
import LoadNotificationsType from './utils/LoadNotifications';

export interface NotificationBellProps {
  user: User | null;
  onSettingsClick?: () => void;
  size?: TIconButtonProps['size'];
}

interface NotificationBellContentProps extends Omit<NotificationBellProps, 'user'> {
  userId: NonNullable<User['id']>;
  enableNotificationsM2?: boolean; // TODO @ahua (1/30/2026): Remove once notifications M2 is fully released
  sendEvent: TSendEvent;
}

const MAX_NOTIFICATIONS = 150;
const HOURS_IN_MS = 3600000; // 60 * 60 * 1000
const MAX_DISPLAYED_BELL_ICON_COUNT = 99;
const SHOW_NEW_LOOK_TOOLTIP_DURATION_MS = 8 * 1000;

export const prependFreshNotifications = (
  existingNotifications: TNotificationGroup[],
  fetchedNotifications: TNotificationGroup[],
): { merged: TNotificationGroup[]; freshNotifications: TNotificationGroup[] } => {
  // fetchedNotifications are the first page of results.
  // dedupe from previously fetched and merge
  const existingIds = new Set(existingNotifications.map((n) => n.titleNotification.notificationId));
  const freshNotifications = fetchedNotifications.filter(
    (n) => !existingIds.has(n.titleNotification.notificationId),
  );
  return {
    merged: [...freshNotifications, ...existingNotifications],
    freshNotifications,
  };
};

export const NotificationBellCountBadge: FunctionComponent<{ count: number }> = ({ count }) => {
  const { classes, cx } = useNotificationBellStyles();
  const { translate } = useTranslation();

  const displayCount = useMemo(() => {
    if (count >= MAX_DISPLAYED_BELL_ICON_COUNT) {
      return `${MAX_DISPLAYED_BELL_ICON_COUNT}+`;
    }
    return count.toString();
  }, [count]);
  const ariaLabel = useMemo(() => {
    return (
      translate('Message.UnreadNotificationsWithCount', { count: displayCount }) ||
      `${count} unread`
    );
  }, [count, displayCount, translate]);

  if (count === 0) {
    return null;
  }

  return (
    <span
      tabIndex={-1}
      className={cx(
        classes.badge,
        'padding-x-xsmall radius-circle text-label-small content-emphasis bg-system-emphasis',
      )}
      aria-label={ariaLabel}>
      {displayCount}
    </span>
  );
};

const NotificationBellContent: FunctionComponent<NotificationBellContentProps> = ({
  userId,
  size = 'large',
  onSettingsClick,
  sendEvent,
  enableNotificationsM2,
}) => {
  const { classes: styles, cx } = useNotificationBellStyles();
  const { translate } = useTranslation();
  const { notificationClient } = useNotificationClient();
  const [newLookTooltipSeen, setNewLookTooltipSeen] = useLocalStorage<string>(
    `NotificationTrayNewLookSeen.${userId}`,
    'false',
  );
  const [expanded, setExpanded] = useState<boolean>(false);
  const [newNotificationExists, setNewNotificationExists] = useState(false);
  const [notifications, setNotifications] = useState<TNotificationGroup[]>([]);
  const [newestNotificationId, setNewestNotificationId] = useState<string>('');
  const [loadingTray, setLoadingTray] = useState(false);
  const [failedToLoad, setFailedToLoad] = useState(false);
  const [noMoreNotifications, setNoMoreNotifications] = useState(false);
  const [freshNotifsSnackbarCount, setFreshNotifsSnackbarCount] = useState(0);
  const [fetchedFreshNotifsCount, setFetchedFreshNotifsCount] = useState(0);
  const [showFreshUnseenNotifsSnackbar, setShowFreshUnseenNotifsSnackbar] = useState(false);
  const [firstNotificationPage, setFirstNotificationPage] = useState<
    CreatorStreamNotification[] | undefined
  >(undefined);
  const [firstTimeLoadingNotificationsFinished, setFirstTimeLoadingNotificationsFinished] =
    useState<boolean>(false);
  const listScrollRef = useRef<{
    scrollTop: number;
    scrollHeight: number;
  }>({
    scrollTop: 0,
    scrollHeight: 0,
  });
  // make tray appear 'loading' initially, even before load page starts
  const initialLoadingStateRef = useRef(true);
  const impressionSentRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trayContentFirstFocusableElRef = useRef<
    HTMLDivElement | HTMLAnchorElement | HTMLButtonElement | null
  >(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const bellIconRef = useRef<HTMLButtonElement | null>(null);
  const prevBellIconCountRef = useRef<number>(0);
  const paginateCursorRef = useRef('');
  const syncBroadcastedNotificationsRef = useRef(true);
  const isUsingKeyboardToToggleExpandRef = useRef(false);
  const loadingPageByTypeRef = useRef<Partial<Record<LoadNotificationsType, boolean>>>({});
  const loadPageDebounceByTypeRef = useRef<
    Partial<Record<LoadNotificationsType, ReturnType<typeof setTimeout>>>
  >({});
  const firstNotificationPageViewLogged = useRef(false);
  const prevExpandedRef = useRef<boolean>(false);
  const activateRefreshScrollPosBehaviorRef = useRef<boolean>(false);
  // use a ref to use current expanded value in debounced loadPage fns
  const expandedRef = useRef(expanded);
  const trayOpenTimestampRef = useRef<number | null>(null);
  const trayCloseSourceRef = useRef<NotificationTrayCloseSource | null>(null);
  const {
    reportNewUnseenNotifFrontier,
    setLastSeenNotificationId,
    setNewUnseenNotifFrontier,
    unseenNotifFrontierIndex,
    lastSeenNotificationId,
  } = useNotificationsM2Tracking({
    notifications,
    userId,
  });
  const isCompact = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const markAllAsRead = useCallback(() => {
    setNotifications((oldNotifications) => {
      const clonedNotificationGroups = oldNotifications.map((n) => {
        const readNotification = structuredClone(n);
        readNotification.titleNotification.read = true;
        readNotification.children = readNotification.children.map(
          (child: CreatorStreamNotification) => {
            const readChildNotification = structuredClone(child);
            readChildNotification.read = true;

            return readChildNotification;
          },
        );

        return readNotification;
      });

      return clonedNotificationGroups;
    });
  }, []);

  const loadPage = useCallback(
    async (loadNotificationsType: LoadNotificationsType) => {
      // isRefresh: get fresh notifications, append to top of notifications list
      // otherwise, isRefresh=false -> pagination: append to bottom of notifications list, page for next notifications
      if (
        loadingTray ||
        (noMoreNotifications && loadNotificationsType === LoadNotificationsType.Paginate) ||
        loadingPageByTypeRef.current[loadNotificationsType]
      ) {
        return;
      }

      try {
        loadingPageByTypeRef.current[loadNotificationsType] = true;
        initialLoadingStateRef.current = false;
        setLoadingTray(true);
        setFailedToLoad(false);

        const isFullRefresh = syncBroadcastedNotificationsRef.current;
        const fetchingMostRecentNotifs =
          notifications.length === 0 ||
          loadNotificationsType === LoadNotificationsType.Refresh ||
          loadNotificationsType === LoadNotificationsType.ReloadAll ||
          !paginateCursorRef.current;
        const newNotifsCursor = fetchingMostRecentNotifs ? '' : paginateCursorRef.current;
        const args: CreatorStreamNotificationsGetCreatorStreamNotificationsByUserRequest = {
          userId,
          count: NOTIFICATION_CLIENT_PAGE_SIZE,
          notificationChannel: CREATOR_HUB_NOTIFICATION_CHANNEL,
          cursor: newNotifsCursor || undefined,
          fullRefresh: isFullRefresh || undefined,
        };

        const fetched =
          await notificationClient?.creatorStreamNotificationsGetCreatorStreamNotificationsByUser(
            args,
          );

        if (isFullRefresh) {
          syncBroadcastedNotificationsRef.current = false;
        }
        const fetchedNotifs = formatNotifications(fetched?.creatorStreamNotifications);
        /** logic:
         *   if user was paging OR reloading (e.g. hit 'retry' on on error tray ui)
         *     - and nextCursor is empty:
         *       - user is at tail end of notifications list,
         *         and there are no more notificaations
         *     - and nextCursor is nonempty:
         *       - user is not at tail end of notifications list,
         *         and there are more notificaations
         *  if user was refreshing (getting new most recent notifs):
         *     - and nextCursor is empty:
         *         - user has loaded all new most recent notifs,
         *           and they are the only notifs in the list
         *           (prev. notifs was empty)
         *     - and nextCursor is nonempty:
         *         - user has loaded all new most recent notifs,
         *           the nextCursor's page (of the refresh) is already loaded previously,
         *           (appended to bottom of refreshed notifs).
         *           Note that we don't want to reset paginateCursorRef.current on next page,
         *           so that paging still gets 'next' page correctly
         */
        let newNotifsList: TNotificationGroup[] = [];
        let results: { merged: TNotificationGroup[]; freshNotifications: TNotificationGroup[] } = {
          merged: [],
          freshNotifications: [],
        };
        switch (loadNotificationsType) {
          case LoadNotificationsType.Paginate:
            setNotifications((notifs) => {
              newNotifsList = [...notifs, ...fetchedNotifs];
              if (newNotifsList.length > MAX_NOTIFICATIONS + fetchedFreshNotifsCount) {
                setNoMoreNotifications(true);
              }
              return newNotifsList;
            });
            if (
              !fetchedNotifs ||
              fetchedNotifs.length === 0 ||
              !fetched?.nextCursor // fetched last page of notifs
            ) {
              setNoMoreNotifications(true);
            }
            paginateCursorRef.current = fetched?.nextCursor || '';
            break;
          case LoadNotificationsType.ReloadAll:
            setNotifications(fetchedNotifs);
            if (expandedRef.current && fetchedNotifs.length > 0) {
              setNewUnseenNotifFrontier(fetchedNotifs[0].titleNotification.notificationId);
            }
            setFetchedFreshNotifsCount(0);
            setNoMoreNotifications(
              !fetched?.nextCursor || fetchedNotifs.length >= MAX_NOTIFICATIONS,
            );
            paginateCursorRef.current = fetched?.nextCursor || '';

            // scroll to top
            requestAnimationFrame(() => {
              if (listRef.current) {
                listRef.current.scrollTop = 0;
              }
            });
            break;
          case LoadNotificationsType.Refresh:
            if (!fetched?.nextCursor) {
              // user has loaded all new most recent notifs,
              // and they are the only notifs in the list
              // (prev. notifs was empty)
              setNoMoreNotifications(true);
            }
            results = prependFreshNotifications(notifications, fetchedNotifs);
            newNotifsList = results.merged;
            setFetchedFreshNotifsCount((oldCount) => oldCount + results.freshNotifications.length);
            setNotifications(newNotifsList);
            if (results.freshNotifications.length > 0) {
              setFreshNotifsSnackbarCount((prev) => {
                // update existing count on existing snackbar text, or
                // set new count on new snackbar (within a new 'fresh
                // notifications' snackbar session)
                return showFreshUnseenNotifsSnackbar
                  ? prev + results.freshNotifications.length
                  : results.freshNotifications.length;
              });
              if (expandedRef.current) {
                setShowFreshUnseenNotifsSnackbar(true);
              }
            }
            break;
          default:
            throw new Error(`Invalid loadNotificationsType: ${loadNotificationsType}`);
        }

        if (
          !enableNotificationsM2 &&
          fetchingMostRecentNotifs &&
          fetchedNotifs?.length > 0 &&
          fetchedNotifs[0].titleNotification.notificationId
        ) {
          setNewestNotificationId(fetchedNotifs[0].titleNotification.notificationId);
        }

        setFailedToLoad(false);

        if (!enableNotificationsM2) {
          if (notifications.length !== 0) {
            sendEvent(notificationsImpressionEventModel(fetched?.creatorStreamNotifications ?? []));
          } else {
            setFirstNotificationPage(fetched?.creatorStreamNotifications ?? []);
          }
        }
      } catch {
        setFailedToLoad(true);
      } finally {
        loadingPageByTypeRef.current[loadNotificationsType] = false;
        setLoadingTray(false);
        setFirstTimeLoadingNotificationsFinished(true);
        activateRefreshScrollPosBehaviorRef.current =
          expandedRef.current && loadNotificationsType === LoadNotificationsType.Refresh;
      }
    },
    [
      enableNotificationsM2,
      setNewUnseenNotifFrontier,
      loadingTray,
      fetchedFreshNotifsCount,
      noMoreNotifications,
      notificationClient,
      notifications,
      sendEvent,
      showFreshUnseenNotifsSnackbar,
      userId,
    ],
  );

  const loadPageDebounced = useCallback(
    (loadNotificationsType: LoadNotificationsType) => {
      // trailing debounce
      const existing = loadPageDebounceByTypeRef.current[loadNotificationsType];
      if (existing) {
        clearTimeout(existing);
      }
      loadPageDebounceByTypeRef.current[loadNotificationsType] = setTimeout(async () => {
        delete loadPageDebounceByTypeRef.current[loadNotificationsType];
        await loadPage(loadNotificationsType);
      }, 250);
    },
    [loadPage],
  );

  const onNewNotification = useCallback(
    (newNotificationId: string) => {
      if (!enableNotificationsM2) {
        setNewestNotificationId(newNotificationId);
      }
      if (enableNotificationsM2) {
        // updates bell icon count, too
        loadPageDebounced(LoadNotificationsType.Refresh);
      }
    },
    [enableNotificationsM2, loadPageDebounced, setNewestNotificationId],
  );

  const showNewLookTooltip = useMemo(() => {
    return !isCompact && newLookTooltipSeen !== 'true' && notifications.length > 0;
  }, [isCompact, newLookTooltipSeen, notifications.length]);

  useEffect(() => {
    if (!enableNotificationsM2 && expanded && notifications.length > 0) {
      setLastSeenNotificationId(notifications?.[0].titleNotification.notificationId);
    }
  }, [enableNotificationsM2, expanded, notifications, setLastSeenNotificationId]);

  // on refresh, either preserve scroll position or reset unseen frontier
  useLayoutEffect(() => {
    if (
      enableNotificationsM2 &&
      expandedRef.current &&
      activateRefreshScrollPosBehaviorRef.current
    ) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (listRef.current) {
            if (listScrollRef.current.scrollTop > 0) {
              // preserve last known scroll position (in listScrollRef)
              const heightDifference =
                listRef.current.scrollHeight - listScrollRef.current.scrollHeight;
              listRef.current.scrollTop = listScrollRef.current.scrollTop + heightDifference;
            } else {
              // user is at top
              setNewUnseenNotifFrontier(notifications[0].titleNotification.notificationId);
            }
          }
          activateRefreshScrollPosBehaviorRef.current = false;
        });
      });
    }
  }, [enableNotificationsM2, notifications, setNewUnseenNotifFrontier]);

  useEffect(() => {
    if (
      !enableNotificationsM2 &&
      !firstNotificationPageViewLogged.current &&
      expanded &&
      firstNotificationPage
    ) {
      firstNotificationPageViewLogged.current = true;
      sendEvent(notificationsImpressionEventModel(firstNotificationPage));
    }
  }, [enableNotificationsM2, expanded, firstNotificationPage, sendEvent]);

  useEffect(() => {
    if (!showFreshUnseenNotifsSnackbar) {
      // reset count when snackbar is closed
      setFreshNotifsSnackbarCount(0);
    }
  }, [showFreshUnseenNotifsSnackbar, setFreshNotifsSnackbarCount]);

  useEffect(() => {
    expandedRef.current = expanded;

    // when tray opens
    if (prevExpandedRef.current === false && expanded === true) {
      // track tray open
      trayOpenTimestampRef.current = Date.now();
      trayCloseSourceRef.current = null;

      if (notifications.length > 0) {
        setNewUnseenNotifFrontier(notifications[0].titleNotification.notificationId);
      }
      if (isUsingKeyboardToToggleExpandRef.current) {
        trayContentFirstFocusableElRef.current?.focus();
      }
      // reset scroll position
      if (listRef.current) {
        listRef.current.scrollTop = 0;
        listScrollRef.current = {
          scrollTop: 0,
          scrollHeight: listRef.current.scrollHeight,
        };
      }
    }

    // when tray closes
    if (prevExpandedRef.current === true && expanded === false) {
      // reset states
      setShowFreshUnseenNotifsSnackbar(false);
      activateRefreshScrollPosBehaviorRef.current = false;
      setNewUnseenNotifFrontier(undefined);

      // Send close event
      const durationMs = trayOpenTimestampRef.current
        ? Date.now() - trayOpenTimestampRef.current
        : undefined;
      // Default to 'clickOutside' if source is not explicitly set
      const source = trayCloseSourceRef.current || NotificationTrayCloseSource.ClickOutside;
      sendEvent(
        closeNotificationTrayEventModel(
          {
            hasUnSeenNotifications: false, // because tray is closed, then there is no unread notifications
            unreadNotificationCount: notifications.filter(
              (notification) => !notification.titleNotification.read,
            ).length,
            notificationsCount: notifications.length,
          },
          durationMs,
          source,
        ),
      );
      trayOpenTimestampRef.current = null;
      trayCloseSourceRef.current = null;

      if (isUsingKeyboardToToggleExpandRef.current) {
        bellIconRef?.current?.focus();
      }
    }

    prevExpandedRef.current = expanded;
    isUsingKeyboardToToggleExpandRef.current = false;
  }, [
    expanded,
    notifications,
    setNewUnseenNotifFrontier,
    sendEvent,
    setShowFreshUnseenNotifsSnackbar,
    setFreshNotifsSnackbarCount,
    reportNewUnseenNotifFrontier,
  ]);

  useEffect(() => {
    setNewNotificationExists(
      !!newestNotificationId && lastSeenNotificationId !== newestNotificationId,
    );
  }, [lastSeenNotificationId, newestNotificationId]);

  // NOTE (@mbae, 03/26/24): Notifications in the backend aren't always up-to-date
  // Broadcasted notifications need to be "pulled in", so the frontend is tasked
  // with telling the backend to occassionally pull broadcasted notifications in
  // for the specific user
  useEffect(() => {
    const interval = setInterval(() => {
      syncBroadcastedNotificationsRef.current = true;
    }, HOURS_IN_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const toggleOpenTray = useCallback(
    (fromKeyboardEvent: boolean = false) => {
      if (newNotificationExists) {
        setNotifications([]);
      }

      setExpanded((isExpanded) => {
        if (!isExpanded) {
          // open
          sendEvent(
            openNotificationTrayEventModel({
              hasUnSeenNotifications: newNotificationExists,
              unreadNotificationCount: notifications.filter(
                (notification) => !notification.titleNotification.read,
              ).length,
              notificationsCount: notifications.length,
            }),
          );
          setNewNotificationExists(false);
          if (fromKeyboardEvent) {
            isUsingKeyboardToToggleExpandRef.current = true;
            trayContentFirstFocusableElRef.current?.focus();
          }
        } else {
          // Track that closing is from bell icon
          trayCloseSourceRef.current = NotificationTrayCloseSource.BellIcon;
          if (newLookTooltipSeen !== 'true') {
            setNewLookTooltipSeen('true');
          }
        }
        return !isExpanded;
      });
    },
    [newNotificationExists, notifications, sendEvent, newLookTooltipSeen, setNewLookTooltipSeen],
  );

  const closeTrayFromOutside = useCallback(() => {
    setExpanded(false);
    if (newLookTooltipSeen !== 'true') {
      setNewLookTooltipSeen('true');
    }
  }, [newLookTooltipSeen, setNewLookTooltipSeen]);

  // auto-open tray if new look to be announced
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (
      !isCompact &&
      enableNotificationsM2 &&
      showNewLookTooltip &&
      !expanded &&
      notifications.length > 0
    ) {
      toggleOpenTray();
      timeout = setTimeout(() => {
        setNewLookTooltipSeen('true');
      }, SHOW_NEW_LOOK_TOOLTIP_DURATION_MS);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [
    isCompact,
    enableNotificationsM2,
    showNewLookTooltip,
    notifications.length,
    expanded,
    toggleOpenTray,
    setNewLookTooltipSeen,
  ]);

  // handle outside click + icon button click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && buttonRef.current.contains(event.target as Node)) {
        toggleOpenTray();
      } else if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        expanded
      ) {
        closeTrayFromOutside();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [expanded, toggleOpenTray, closeTrayFromOutside]);

  useEffect(() => {
    signalREventEmitter.on('newNotification', onNewNotification);
    return () => {
      signalREventEmitter.removeListener('newNotification', onNewNotification);
    };
  }, [onNewNotification]);

  useEffect(() => {
    if (!failedToLoad && !loadingTray && notifications.length === 0 && !noMoreNotifications) {
      loadPageDebounced(LoadNotificationsType.ReloadAll);
    }
  }, [failedToLoad, loadingTray, loadPageDebounced, notifications, noMoreNotifications]);

  const EntrypointIcon = expanded ? NotificationsIcon : NotificationsOutlinedIcon;

  // NOTE (@neoxu, 11/10/2025)
  // Track notification bell icon impression when tray loading finishes
  // Only execute once after tray finishes rendering
  useEffect(() => {
    // Send impression once when loading finishes
    if (firstTimeLoadingNotificationsFinished && !impressionSentRef.current) {
      const newNotificationId = notifications?.[0]?.titleNotification?.notificationId;
      impressionSentRef.current = true;
      // NOTE (@neoxu, 11/12/2025): Since already has the notifications calculate `hasUnSeenNotifications` to reduce the dependency on `newNotificationExists`
      sendEvent(
        notificationBellIconImpressionEventModel({
          hasUnSeenNotifications: !!(
            newNotificationId && lastSeenNotificationId !== newNotificationId
          ),
          unreadNotificationCount: notifications.filter(
            (notification) => !notification.titleNotification.read,
          ).length,
          notificationsCount: notifications.length,
        }),
      );
    }
  }, [firstTimeLoadingNotificationsFinished, lastSeenNotificationId, notifications, sendEvent]);
  // NOTE (@neoxu, 11/10/2025)
  // Track notification bell icon impression when new notification indicator appears from hidden to visible
  // trigger conditions:
  // 1. newestNotificationId is not empty. means receiving new notification from signalREventEmitter
  // 2. newNotificationExists is changed from false to true. means new notification indicator appears from hidden to visible
  // 3. notification tray is not expanded. means notification tray is not visible
  const prevNewNotificationExistsRef = useRef<boolean>(false);
  useEffect(() => {
    if (
      newestNotificationId &&
      newNotificationExists &&
      !expanded &&
      !prevNewNotificationExistsRef.current
    ) {
      sendEvent(
        notificationBellIconImpressionEventModel({
          hasUnSeenNotifications: newNotificationExists,
          unreadNotificationCount: notifications.filter(
            (notification) => !notification.titleNotification.read,
          ).length,
          notificationsCount: notifications.length,
        }),
      );
    }

    // Update the previous value for next comparison
    prevNewNotificationExistsRef.current = newNotificationExists;
  }, [newNotificationExists, newestNotificationId, expanded, notifications, sendEvent]);

  // bell icon count = '# unseen notifs since last tray open', and
  // resets to 0 when lastSeenNotificationId is set to topmost notif in list
  //   and does not live-decrement as notifs are seen in same tray session
  const bellIconCount = useMemo(() => {
    if (expandedRef.current && listScrollRef.current.scrollTop === 0) {
      return 0;
    }
    const lastSeenNotifIdx = notifications.findIndex(
      (n) => n.titleNotification.notificationId === lastSeenNotificationId,
    );
    const count = Math.min(
      lastSeenNotifIdx === -1 ? notifications.length : lastSeenNotifIdx,
      MAX_DISPLAYED_BELL_ICON_COUNT,
    );
    prevBellIconCountRef.current = count;
    return count;
  }, [lastSeenNotificationId, notifications]);

  if (enableNotificationsM2) {
    return (
      <>
        <div
          aria-label={`${translate('Heading.Notifications')}`}
          role='button'
          tabIndex={-1}
          ref={buttonRef as React.RefObject<HTMLDivElement | null>}
          onKeyDown={(e: React.KeyboardEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (e.key === 'Enter' || e.key === 'Space') {
              toggleOpenTray(true);
            } else if (e.key === 'Tab' || e.key === ' ' || e.key === 'ArrowDown') {
              trayContentFirstFocusableElRef.current?.focus();
            }
          }}
          className={styles.bellButtonContainer}>
          <div className='relative'>
            <FoundationIconButton
              variant='OverMedia'
              ref={bellIconRef}
              size='Medium'
              icon='icon-regular-bell'
              ariaLabel={translate('Heading.Notifications')}
            />
            <NotificationBellCountBadge count={bellIconCount} />
          </div>
        </div>
        {createPortal(
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions
          <div
            tabIndex={-1}
            role='dialog'
            className={styles.popperContent}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Escape') {
                closeTrayFromOutside();
                isUsingKeyboardToToggleExpandRef.current = true;
              }
            }}
            style={{
              display: expanded ? 'block' : 'none',
            }}>
            <NotificationList
              ref={containerRef}
              showNewLookTooltip={showNewLookTooltip}
              trayContentFirstFocusableElRef={trayContentFirstFocusableElRef}
              unseenNotifFrontierIndex={unseenNotifFrontierIndex}
              listScrollRef={listScrollRef}
              reportNewUnseenNotifFrontier={reportNewUnseenNotifFrontier}
              setNewUnseenNotifFrontier={setNewUnseenNotifFrontier}
              failedToLoad={failedToLoad}
              listRef={listRef}
              expanded={expanded}
              loadPage={loadPageDebounced}
              loadingTray={loadingTray || initialLoadingStateRef.current}
              markAllAsRead={markAllAsRead}
              newNotificationExists={newNotificationExists}
              noMoreNotifications={noMoreNotifications}
              notifications={notifications}
              setNewNotificationExists={setNewNotificationExists}
              setNotifications={setNotifications}
              userId={userId}
              setExpanded={setExpanded}
              onSettingsClick={onSettingsClick}
              enableNotificationsM2={enableNotificationsM2}
              freshNotificationsSnackbar={{
                count: freshNotifsSnackbarCount,
                show: showFreshUnseenNotifsSnackbar,
                close: () => setShowFreshUnseenNotifsSnackbar(false),
                onScrollToTop: () => {
                  setShowFreshUnseenNotifsSnackbar(false);
                },
              }}
            />
          </div>,
          document.body,
        )}
      </>
    );
  }

  return (
    <div data-testid='notification-bell' className={styles.gridContainer}>
      <Grid className={styles.container}>
        <IconButton
          aria-label={`${translate('Heading.Notifications')}`}
          color='secondary'
          size={size}
          ref={buttonRef}
          className={cx(expanded ? styles.expanded : null)}>
          {newNotificationExists && (
            <Badge variant='dot' color='primary'>
              <EntrypointIcon />
            </Badge>
          )}
          {!newNotificationExists && <EntrypointIcon />}
        </IconButton>
      </Grid>
      {expanded && (
        <NotificationList
          showNewLookTooltip={showNewLookTooltip}
          trayContentFirstFocusableElRef={trayContentFirstFocusableElRef}
          unseenNotifFrontierIndex={unseenNotifFrontierIndex}
          listScrollRef={listScrollRef}
          reportNewUnseenNotifFrontier={reportNewUnseenNotifFrontier}
          setNewUnseenNotifFrontier={setNewUnseenNotifFrontier}
          ref={containerRef}
          failedToLoad={failedToLoad}
          listRef={listRef}
          loadPage={loadPageDebounced}
          loadingTray={loadingTray}
          markAllAsRead={markAllAsRead}
          newNotificationExists={newNotificationExists}
          noMoreNotifications={noMoreNotifications}
          notifications={notifications}
          setNewNotificationExists={setNewNotificationExists}
          setNotifications={setNotifications}
          userId={userId}
          expanded={expanded}
          setExpanded={setExpanded}
          onSettingsClick={onSettingsClick}
          enableNotificationsM2={enableNotificationsM2}
          freshNotificationsSnackbar={{
            count: freshNotifsSnackbarCount,
            show: showFreshUnseenNotifsSnackbar,
            close: () => setShowFreshUnseenNotifsSnackbar(false),
            onScrollToTop: () => {
              setFreshNotifsSnackbarCount(0);
              setShowFreshUnseenNotifsSnackbar(false);
            },
          }}
        />
      )}
    </div>
  );
};

export type TSignalRNotificationMessage = {
  NotificationId?: string;
  Action?: 'MarkRead' | 'MarkUnread' | 'MarkAllRead' | 'New';
};

const SignalRInitializer: React.FC<{ children?: React.ReactNode }> = ({
  children: initializerChildren,
}) => {
  const { environment, signalRCrossTab } = useNavigationConfigs();
  const onNotification: TSignalRCallback = useCallback(
    (namespace, detail) => {
      if (namespace === 'CreatorHubTray') {
        const message: TSignalRNotificationMessage = JSON.parse(detail);
        if (!message?.Action) {
          if (environment !== 'production') {
            console.warn('Empty Notification Tray SignalR Message:', detail);
          }

          return;
        }

        if ((!message.Action || message.Action === 'New') && message.NotificationId) {
          signalREventEmitter.emit('newNotification', message.NotificationId);
        } else if (message.Action === 'MarkRead' && message.NotificationId) {
          signalREventEmitter.emit('notificationRead', message.NotificationId);
        } else if (message.Action === 'MarkUnread' && message.NotificationId) {
          signalREventEmitter.emit('notificationUnread', message.NotificationId);
        } else if (message.Action === 'MarkAllRead') {
          signalREventEmitter.emit('allNotificationsRead');
        } else if (environment !== 'production') {
          console.warn(`Unhandled Notification Tray message ${message}`);
        }
      }
    },
    [environment],
  );
  const basePath = getRealTimeNotificationsBasePath(environment);
  useSignalR(onNotification, basePath, {
    crossTab: {
      enabled: signalRCrossTab.enabled,
      isLoading: !signalRCrossTab.isFetched,
    },
  });
  return <>{initializerChildren}</>;
};

export const NotificationBell: FunctionComponent<NotificationBellProps> = ({ user, ...props }) => {
  const { sendEvent, enableNotificationsM2 } = useNavigationConfigs();

  if (user === null || !user.id) {
    return null;
  }

  return (
    <NotificationClientProvider>
      <SignalRInitializer>
        <NotificationBellContent
          userId={user.id}
          sendEvent={sendEvent}
          enableNotificationsM2={enableNotificationsM2}
          {...props}
        />
      </SignalRInitializer>
    </NotificationClientProvider>
  );
};

// provide backwards compatibility
export const NotificationBellV2 = NotificationBell;

export default NotificationBell;
