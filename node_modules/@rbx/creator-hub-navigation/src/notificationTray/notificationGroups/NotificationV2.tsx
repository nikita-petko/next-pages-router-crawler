import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState, useRef, useEffect, forwardRef } from 'react';
import Dompurify, { type Config as DompurifyConfig } from 'dompurify';
import type { CreatorStreamNotification } from '@rbx/client-creator-notification-streams-api/v1';
import {
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Menu as FMenu,
  MenuItem as FMenuItem,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Badge, Card, CardActionArea, Link, Menu, MenuItem } from '@rbx/ui';
import { clickNotificationEventModel } from '../../event/eventConstants';
import useNavigationConfigs from '../../hooks/useNavigationConfigs';
import type useNotificationsM2Tracking from '../hooks/useNotificationsM2Tracking';
import useElapsedTime from '../utils/useElapsedTime';
import useNotificationImpressionTracker from '../utils/useNotificationImpressionTracker';
import NotificationThumbnail from './NotificationThumbnail';
import useNotificationStyles from './NotificationV2.styles';

type TNotificationProps = {
  notificationContent: CreatorStreamNotification;
  markReadStatus?: (notificationId: string, readStatus: boolean) => void;
  notificationGroupIndex?: number; // TODO (@ahua, 02/7/2026): becomes required once bundled notifs are deprecated (M2 full release)
  enableNotificationsM2: boolean;
  reportNewUnseenNotifFrontier?: ReturnType<
    typeof useNotificationsM2Tracking
  >['reportNewUnseenNotifFrontier'];
  unseenNotifFrontierIndex?: number; // index of last unseen notif
  isListOverflowing?: boolean;
};

const NotificationLinkWrapper: FunctionComponent<{
  notification: CreatorStreamNotification;
  onNotificationClick: () => void;
  children?: React.ReactNode;
}> = ({ notification, onNotificationClick, children }) => {
  if (notification?.creatorStreamNotificationContent?.clickAction) {
    return (
      <CardActionArea onClick={onNotificationClick}>
        <Link
          href={notification?.creatorStreamNotificationContent?.clickAction}
          color='inherit'
          target='_blank'
          underline='none'>
          {children}
        </Link>
      </CardActionArea>
    );
  }

  return <>{children}</>;
};

const M2NotificationContainerClassName =
  'relative content-default flex hover:bg-surface-200 focus-visible:bg-surface-200 focus-visible:outline-focus -margin-top-xsmall margin-bottom-xsmall';
const OverflowBtn: React.FC<{ className: string; ariaHidden: boolean }> = ({
  className,
  ariaHidden,
}) => {
  const { translate } = useTranslation();
  const { cx } = useNotificationStyles();
  return (
    <IconButton
      size='Large'
      as='button'
      variant='Utility'
      icon='icon-filled-three-dots-vertical'
      ariaLabel={translate('Label.NotificationMenuAria')}
      aria-hidden={ariaHidden}
      className={cx('shrink-0', className)}
    />
  );
};

const Notification = forwardRef<HTMLDivElement | HTMLAnchorElement, TNotificationProps>(
  (
    {
      notificationContent,
      reportNewUnseenNotifFrontier,
      markReadStatus,
      notificationGroupIndex,
      // oxlint-disable-next-line typescript/no-useless-default-assignment
      enableNotificationsM2 = false,
      unseenNotifFrontierIndex,
      isListOverflowing,
    },
    ref,
  ) => {
    const { translate } = useTranslation();
    const { sendEvent } = useNavigationConfigs();
    const { classes: styles, cx } = useNotificationStyles();
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const [isMultiLine, setIsMultiLine] = useState(false);
    const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
    const titleRef = useRef<HTMLDivElement>(null);
    const focusableRef = useRef<HTMLDivElement | HTMLAnchorElement | null>(null);
    const impressionRef = useRef<HTMLDivElement>(null);

    const setFocusableRefs = useCallback(
      (el: HTMLDivElement | HTMLAnchorElement | null) => {
        focusableRef.current = el;
        if (ref && 'current' in ref) {
          ref.current = el;
        }
      },
      [ref],
    );

    const onNotificationClick = useCallback(() => {
      sendEvent(clickNotificationEventModel(notificationContent, notificationGroupIndex));
    }, [notificationContent, sendEvent, notificationGroupIndex]);

    const elapsedTime = useElapsedTime(
      (notificationContent.createdUtcTimeInMs ?? 0) / 1000,
      'Label.ElapsedTimeShort',
    );

    // Track impression when the notification enters viewport
    useNotificationImpressionTracker(
      impressionRef,
      notificationContent,
      sendEvent,
      enableNotificationsM2,
      unseenNotifFrontierIndex,
      reportNewUnseenNotifFrontier,
      notificationGroupIndex,
    );

    const handleMenuClose = useCallback(() => {
      setMenuAnchor(null);
    }, []);

    const handleTurnOff = useCallback(
      (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        handleMenuClose();
      },
      [handleMenuClose],
    );

    const handleMarkReadStatus = useCallback(
      (readStatus: boolean) => {
        if (markReadStatus && notificationContent.notificationId) {
          markReadStatus(notificationContent.notificationId, readStatus);
        }
        setIsOverflowMenuOpen(false);
      },
      [markReadStatus, notificationContent.notificationId],
    );

    const notifIsUnread = !notificationContent.read;
    const toggleReadStatus = useCallback(() => {
      handleMarkReadStatus(!notificationContent.read);
    }, [handleMarkReadStatus, notificationContent.read]);

    const {
      sanitizedNotificationTitle,
      plainNotificationTitle,
      sanitizedNotificationBody,
      plainNotificationBody,
    } = useMemo<{
      sanitizedNotificationTitle: string;
      plainNotificationTitle: string;
      sanitizedNotificationBody: string;
      plainNotificationBody: string;
    }>((): {
      sanitizedNotificationTitle: string;
      plainNotificationTitle: string;
      sanitizedNotificationBody: string;
      plainNotificationBody: string;
    } => {
      const options: DompurifyConfig = {
        ALLOWED_TAGS: ['b', 'i', 'u', 's', 'br'],
        ALLOWED_ATTR: [],
      };
      const sanitizedTitle: string = Dompurify.sanitize(
        `${notificationContent?.creatorStreamNotificationContent?.title}`,
        options,
      );
      const sanitizedBody: string = Dompurify.sanitize(
        `${notificationContent?.creatorStreamNotificationContent?.body}`,
        options,
      );
      const plainTitle = sanitizedTitle.replaceAll(/<[^>]*>?/g, '').trim();
      const plainBody = sanitizedBody.replaceAll(/<[^>]*>?/g, '').trim();
      return {
        sanitizedNotificationTitle: sanitizedTitle,
        plainNotificationTitle: plainTitle,
        sanitizedNotificationBody: sanitizedBody,
        plainNotificationBody: plainBody,
      };
    }, [
      notificationContent?.creatorStreamNotificationContent?.title,
      notificationContent?.creatorStreamNotificationContent?.body,
    ]);

    const hasBodyText = !!notificationContent?.creatorStreamNotificationContent?.body;

    // Detect if title wraps to multiple lines or if body text exists
    useEffect(() => {
      if (titleRef.current) {
        const lineHeight = parseFloat(getComputedStyle(titleRef.current).lineHeight) || 19.6; // 14px * 1.4 line-height
        const height = titleRef.current.offsetHeight;
        // Title is multiline if height exceeds ~1.5x line height (accounting for minor variations)
        const isTitleMultiLine = height > lineHeight * 1.5;
        setIsMultiLine(isTitleMultiLine || hasBodyText);
      }
    }, [sanitizedNotificationTitle, hasBodyText]);

    if (enableNotificationsM2) {
      const showNotifDot = !notificationContent.read;
      const hasClickAction = !!notificationContent?.creatorStreamNotificationContent?.clickAction;
      const content = (
        <div ref={impressionRef} className={cx('flex', styles.contentWrapper)}>
          <NotificationThumbnail
            targetType={notificationContent?.creatorStreamNotificationContent?.targetType}
            targetId={notificationContent?.creatorStreamNotificationContent?.targetId}
            enableNotificationsM2={enableNotificationsM2}
          />
          <div className={styles.content}>
            <div className='flex relative'>
              <h4
                className={cx(styles.title, styles.truncatedText, 'text-title-medium', {
                  'content-emphasis': notifIsUnread,
                  'content-muted': !notifIsUnread,
                })}
                title={plainNotificationTitle}
                // oxlint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: sanitizedNotificationTitle,
                }}
              />
              <div
                className={cx(
                  'padding-left-small padding-right-small no-wrap text-no-wrap text-body-small',
                  {
                    'content-default': notifIsUnread,
                    'content-muted': !notifIsUnread,
                  },
                )}>
                {elapsedTime}
              </div>
              {showNotifDot && <Badge className={styles.readIndicator} variant='dot' />}
              <OverflowBtn
                className={cx(styles.overflowBtnHidden, styles.overflowBtn)}
                ariaHidden
              />
            </div>
            {plainNotificationBody && (
              <p
                title={plainNotificationBody}
                className={cx(styles.truncatedText, 'margin-none text-body-medium', {
                  'content-default': notifIsUnread,
                  'content-muted': !notifIsUnread,
                })}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: sanitizedNotificationBody,
                }}
              />
            )}
          </div>
        </div>
      );
      // note: PopoverTrigger needs to pass props to a DOM element. wrap custom
      // OverflowBtn in a div to meet this requirement.
      const overflowBtn = (
        <Popover open={isOverflowMenuOpen} onOpenChange={setIsOverflowMenuOpen}>
          <PopoverTrigger asChild>
            <div className={styles.overflowBtnClickableWrapper}>
              <OverflowBtn
                className={cx('padding-large', styles.overflowBtnClickable, styles.overflowBtn)}
                ariaHidden={false}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent side='bottom' align='end' ariaLabel={translate('Label.Menu')}>
            <div
              role='none'
              tabIndex={-1}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                }
              }}>
              <FMenu
                size='Medium'
                aria-label={translate('Label.ActionsForContent', {
                  content: notifIsUnread
                    ? translate('Label.MarkAsRead')
                    : translate('Label.MarkAsUnread'),
                })}
                className={cx(
                  'bg-surface-300 radius-medium text-body-medium',
                  styles.overflowMenu,
                )}>
                <button
                  type='button'
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === 'Space') {
                      toggleReadStatus();
                      focusableRef.current?.focus();
                    } else if (
                      e.key === '  ' ||
                      e.key === 'Tab' ||
                      e.key === 'ArrowDown' ||
                      e.key === 'ArrowUp' ||
                      e.key === 'ArrowLeft' ||
                      e.key === 'ArrowRight' ||
                      e.key === 'Escape'
                    ) {
                      focusableRef.current?.focus();
                    }
                  }}>
                  <FMenuItem
                    value={notifIsUnread ? 'mark-as-read' : 'mark-as-unread'}
                    title={
                      notifIsUnread
                        ? translate('Label.MarkAsRead') || 'Mark as read'
                        : translate('Label.MarkAsUnread') || 'Mark as unread'
                    }
                    aria-label={
                      notifIsUnread
                        ? translate('Label.MarkAsRead')
                        : translate('Label.MarkAsUnread')
                    }
                    onSelect={toggleReadStatus}
                  />
                </button>
              </FMenu>
            </div>
          </PopoverContent>
        </Popover>
      );

      if (hasClickAction) {
        return (
          <div
            className={cx(M2NotificationContainerClassName, styles.root, {
              [styles.isOnOverflowingList]: isListOverflowing,
            })}>
            <div className='relative width-full'>
              <Link
                tabIndex={0}
                ref={setFocusableRefs}
                href={notificationContent.creatorStreamNotificationContent?.clickAction}
                underline='none'
                className='focus-visible:block focus-visible:bg-surface-200 focus-visible:outline-focus'
                color='inherit'>
                {content}
              </Link>
              {overflowBtn}
            </div>
          </div>
        );
      }

      return (
        <div
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          role='alert'
          ref={setFocusableRefs}
          className={cx(M2NotificationContainerClassName, styles.root, {
            [styles.isOnOverflowingList]: isListOverflowing,
          })}>
          <div className='relative width-full'>
            {content}
            {overflowBtn}
          </div>
        </div>
      );
    }

    return (
      <Card classes={{ root: styles.card }}>
        <NotificationLinkWrapper
          notification={notificationContent}
          onNotificationClick={onNotificationClick}>
          <Grid
            ref={impressionRef}
            className={cx(styles.container, isMultiLine && styles.containerMultiLine)}
            container
            onClick={() => {
              if (markReadStatus && !notificationContent.read) {
                markReadStatus(notificationContent.notificationId, true);
              }
            }}>
            <Grid item XSmall='auto'>
              <NotificationThumbnail
                targetType={notificationContent?.creatorStreamNotificationContent?.targetType}
                targetId={notificationContent?.creatorStreamNotificationContent?.targetId}
                enableNotificationsM2={enableNotificationsM2}
              />
            </Grid>
            <Grid item XSmall className={styles.notificationText} zeroMinWidth>
              <Grid container direction='column'>
                <Typography
                  ref={titleRef}
                  variant='body1'
                  className={styles.truncatedText}
                  // oxlint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: sanitizedNotificationTitle,
                  }}
                />
                {notificationContent?.creatorStreamNotificationContent?.body && (
                  <Typography variant='body2' color='secondary' className={styles.truncatedText}>
                    {notificationContent.creatorStreamNotificationContent.body}
                  </Typography>
                )}
              </Grid>
            </Grid>
            <Grid item XSmall='auto'>
              <Grid container alignItems='center' className={styles.rightSection}>
                <div className={styles.badgeContainer}>
                  {!notificationContent.read &&
                    notificationContent?.creatorStreamNotificationContent?.clickAction && (
                      <Badge variant='dot' />
                    )}
                  {!notificationContent?.creatorStreamNotificationContent?.clickAction && (
                    <Badge variant='dot' classes={{ badge: styles.disabledDot }} />
                  )}
                </div>
                <Typography color='secondary' className={styles.timeText}>
                  {elapsedTime}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </NotificationLinkWrapper>
        <Menu
          id={`notification-menu-${notificationGroupIndex ?? 0}-${notificationContent.createdUtcTimeInMs ?? 0}`}
          variant='modal'
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          MenuListProps={{
            'aria-labelledby': translate('Label.NotificationMenuAria'),
          }}>
          <MenuItem variant='standardMenu' onClick={handleTurnOff}>
            <Typography variant='body1' color='primary'>
              {translate('Action.TurnOffNotifications')}
            </Typography>
          </MenuItem>
        </Menu>
      </Card>
    );
  },
);

Notification.displayName = 'Notification';

export default Notification;
