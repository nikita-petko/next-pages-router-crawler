import { makeStyles } from '@rbx/ui';
import { notificationTrayZIndex, topNavHeight } from '../topNavigation/constants/navigationConstants';

export const m2TrayMobileBreakpoint = 'Small';

const useNotificationBellStyles = makeStyles()((theme) => ({
  container: {
    borderRadius: 8,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  expanded: {
    backgroundColor: theme.palette.states.focus,
  },

  hidden: {
    display: 'none',
    pointerEvents: 'none',
  },

  gridContainer: {
    [theme.breakpoints.down('Medium')]: { paddingTop: 4, paddingBottom: 4 },
  },

  popperContent: {
    zIndex: notificationTrayZIndex(theme),
    padding: 0,
    right: 0,
    top: topNavHeight,
    position: 'fixed',
  },

  bellButtonContainer: {
    position: 'relative',
    display: 'inlineflex',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 3,
    left: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 16,
    minHeight: 16,
    paddingLeft: 4,
    paddingRight: 4,
    pointerEvents: 'none',
  },
}));

export default useNotificationBellStyles;
