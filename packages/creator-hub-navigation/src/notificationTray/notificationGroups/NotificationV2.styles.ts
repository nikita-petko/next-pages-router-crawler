import { makeStyles } from '@rbx/ui';
import { CSSProperties } from 'react';
import { m2TrayDesktopDefaultWidth } from '../NotificationList.styles';
import { m2TrayMobileBreakpoint } from '../NotificationBell.styles';
import { notificationOverflowMenuZIndex } from '../../topNavigation/constants/navigationConstants';

const MAX_LINES = 2;
const useNotificationStyles = makeStyles()((theme) => ({
  cardRadius: {
    borderRadius: 8,
  },

  container: {
    backgroundColor: theme.palette.surface[400],
    padding: '8px 12px 8px 8px',
    flexWrap: 'nowrap',
    gap: 4,
    minHeight: 52,
    alignItems: 'center',
  },

  containerMultiLine: {
    alignItems: 'flex-start',
  },

  readIconContainer: {
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 5,
  },

  readIcon: {
    borderRadius: '100%',
  },

  notificationText: {
    overflow: 'hidden',
  },

  truncatedText: {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: MAX_LINES,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-word',
  },

  disabledDot: {
    backgroundColor: theme.palette.states.disabled,
  },

  rightSection: {
    gap: 2,
    flexWrap: 'nowrap',
    alignItems: 'center',
  },

  badgeContainer: {
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  timeText: {
    whiteSpace: 'nowrap',
    fontSize: 14,
    lineHeight: 1.4,
  },

  menuButton: {
    padding: 2,
    width: 20,
    height: 20,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },

  // foundation style notifications
  root: {
    maxWidth: m2TrayDesktopDefaultWidth,
    outlineOffset: -5,
    [theme.breakpoints.down(m2TrayMobileBreakpoint)]: {
      width: '100%',
    },
  },
  contentWrapper: {
    display: 'flex',
    padding: '16px 20px',
  },
  linkWrapper: {
    maxWidth: 360,
  },
  clickable: {
    cursor: 'pointer',
  },
  content: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    flex: 1,
    marginTop: 0,
    marginBottom: 2,
  },
  readIndicator: {
    position: 'relative',
    top: 8,
    marginRight: 8,
    width: 4,
    marginLeft: 0,
  },
  isOnOverflowingList: {
    // pull back since scrollbar shifts
    marginRight: -11
  },
  overflowBtn: {
    height: '20px !important',
    width: '20px !important',
    position: 'relative',
  },
  overflowBtnClickable: {
    position: 'absolute !important' as CSSProperties['position'],
    top: 15,
    right: 20,
    pointerEvents: 'auto',
    cursor: 'pointer',
    zIndex: 2,
  },
  overflowBtnClickableWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  overflowBtnHidden: {
    visibility: 'hidden',
    opacity: 0,
    top: 5,
    right: 0,
    transition: 'visibility 0s, opacity 0.3s ease-in-out',
    pointerEvents: 'none',
  },
  overflowMenu: {
    minWidth: 180,
    marginTop: 40,
    marginRight: 8,
    zIndex: notificationOverflowMenuZIndex(theme),
  },
}));

export default useNotificationStyles;
