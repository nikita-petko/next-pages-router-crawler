import { makeStyles } from '@rbx/ui';
import { topNavHeight } from '../topNavigation/constants/navigationConstants';
import { m2TrayMobileBreakpoint } from './NotificationBell.styles';

export const m2TrayDesktopDefaultWidth = 360;
const m2TrayMarginBottom = 12;
export const m2DesktopTrayMarginRight = 12;
export const m2DesktopTrayMarginLeft = 12;

const useNotificationListStyles = makeStyles()((theme) => ({
  skeleton: {
    position: 'fixed',
    height: '100vh',
    display: 'flex',
    width: 500,
    flexDirection: 'column',
    right: 0,
    top: 0,
    zIndex: theme.zIndex.modal,
    [theme.breakpoints.down('Medium')]: {
      width: '100%',
    },
    pointerEvents: 'none',
  },

  skeletonTray: {
    flex: 1,
    overflow: 'hidden',
    marginTop: 60,
  },

  outerContainer: {
    pointerEvents: 'all',
    backgroundColor: theme.palette.surface[300],
    borderRadius: 12,
    flexGrow: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: 'calc(100% - 24px)',
    margin: 12,
    [theme.breakpoints.down('Medium')]: {
      height: '100%',
      margin: 0,
    },
  },

  listContainer: {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    columnGap: 6,
    paddingTop: 6,
  },

  notificationContainer: {
    marginBottom: 6,
  },

  bottomLoader: {
    height: 60,
  },

  fullCenter: {
    flex: 1,
  },

  snackbarContainer: {
    position: 'absolute',
    width: '100%',
  },

  snackbarContent: {
    padding: '6px 16px 6px  16px',
    backgroundColor: theme.palette.info.main,
    color: theme.palette.content.inverse,
    borderRadius: 6,
    cursor: 'pointer',
  },

  scrollableY: {
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    // Pull scrollbar width back so content doesn't shift
    marginRight: -12,
    scrollbarColor: 'transparent transparent',
    scrollbarGutter: 'auto',
    '&::-webkit-scrollbar': {
      width: 6,
      position: 'absolute',
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: '10rem',
      transition: 'background 0.2s ease',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
      position: 'absolute',
      right: 0,
    },
    // Show on hover
    '&:hover': {
      scrollbarColor: `${theme.palette.states.focusVisible} transparent`,
      '&::-webkit-scrollbar-thumb': {
        background: theme.palette.states.focusVisible,
      },
    },
  },

  // notifications M2 styles
  notificationsM2: {
    marginTop: 0,
    marginBottom: m2TrayMarginBottom,
    marginRight: m2DesktopTrayMarginRight,
    marginLeft: 0,
    maxHeight: 688,
    minHeight: 300,
    width: `min(${m2TrayDesktopDefaultWidth}px, calc(100vw - ${m2DesktopTrayMarginRight}px - ${m2DesktopTrayMarginLeft}px))`,
    overflowX: 'hidden',
    boxSizing: 'content-box',
    height: `calc(100vh - ${topNavHeight + m2TrayMarginBottom}px) !important`,
    overflowY: 'auto',
    [theme.breakpoints.down(m2TrayMobileBreakpoint)]: {
      maxHeight: 712,
      height: `calc(100vh - ${topNavHeight + m2TrayMarginBottom}px) !important`,
      marginTop: 2,
      marginLeft: 0,
      marginRight: 0,
      marginBottom: 0,
      width: '100vw',
    },
  },
  scrollableYM2: {
    width: '100%',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: 'transparent transparent',
    scrollbarGutter: 'auto',
    '&::-webkit-scrollbar-thumb': {
      background: 'transparent',
    },
    '&:hover::-webkit-scrollbar-thumb': {
      background: 'var(--color-shift-400)',
    },
    '&:hover': {
      scrollbarColor: 'var(--color-shift-400) transparent',
    },
  },
  listContainerM2: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    // Pull scrollbar width back so content doesn't shift
    marginRight: -12,
    scrollbarColor: 'transparent transparent',
    scrollbarGutter: 'auto',
    '&::-webkit-scrollbar': {
      width: 6,
      position: 'absolute',
    },
    '&::-webkit-scrollbar-thumb': {
      borderRadius: '10rem',
      transition: 'background 0.2s ease',
    },
  },
  emptyStateContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emptyStateHeader: {
    marginTop: 30,
    marginBottom: 8,
  },
  errorStateHeader: {
    marginTop: 20,
  },
  emptyStateDescription: {
    marginTop: 0,
    paddingLeft: 30,
    paddingRight: 30,
    textAlign: 'center',
    marginBottom: 28,
  },
  retryButton: {
    minWidth: 70,
  },
  snackbarM2Wrapper: {
    position: 'absolute !important' as 'absolute',
    display: 'flex !important' as 'flex',
    justifyContent: 'center !important' as 'center',
    alignItems: 'center !important' as 'center',
    top: 0,
    left: 0,
    right: 0,
    zIndex: theme.zIndex.modal,
  },
  snackbarM2: {
    marginTop: 20,
    cursor: 'pointer',
    width: 'auto !important' as 'auto',
    position: 'static !important' as 'static',
    zIndex: theme.zIndex.modal,
    minWidth: '0 !important' as '0',
    transition: 'none !important' as 'none',
    transform: 'none !important' as 'none',
  },
  tooltipContent: {
    // HACK: fix tooltip beak
    // TODO (@ahua, 2/12/2026): remove when the root cause of tooltip beak showing up is fixed
    '> span:first-child': {
      visibility: 'visible !important' as 'visible',
      top: '22px !important' as '22px',
    },
  },
}));

export default useNotificationListStyles;
